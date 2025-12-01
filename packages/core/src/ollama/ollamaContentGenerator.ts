/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
  Content,
} from '@google/genai';
import { FinishReason } from '@google/genai';
import type { ContentGenerator } from '../core/contentGenerator.js';
import { OllamaClient } from './ollamaClient.js';
import type { OllamaChatResponse } from './types.js';
import {
  generateParamsToOllamaChatRequest,
  ollamaMessageToContent,
} from './converter.js';

export class OllamaContentGenerator implements ContentGenerator {
  private readonly client: OllamaClient;

  constructor(client: OllamaClient) {
    this.client = client;
  }

  async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const ollamaRequest = generateParamsToOllamaChatRequest(request);
    const ollamaResponse = await this.client.chat(ollamaRequest);

    return this.convertOllamaResponseToGenerateContentResponse(ollamaResponse);
  }

  async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const ollamaRequest = generateParamsToOllamaChatRequest(request);
    const self = this;

    async function* streamGenerator(): AsyncGenerator<GenerateContentResponse> {
      for await (const ollamaResponse of self.client.chatStream(ollamaRequest)) {
        yield self.convertOllamaResponseToGenerateContentResponse(ollamaResponse);
      }
    }

    return streamGenerator();
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    // Ollama doesn't have a direct token counting API
    // We'll approximate by counting words and multiplying by 1.3
    // (typical token-to-word ratio for English text)
    const contents = Array.isArray(request.contents)
      ? request.contents
      : [request.contents];

    let totalText = '';

    for (const content of contents) {
      if (typeof content === 'string') {
        totalText += content + ' ';
      } else if (typeof content === 'object' && content !== null && 'parts' in content) {
        const contentObj = content as Content;
        const parts = Array.isArray(contentObj.parts) ? contentObj.parts : [contentObj.parts];
        for (const part of parts) {
          if (part && typeof part === 'object' && 'text' in part && part.text) {
            totalText += part.text + ' ';
          }
        }
      }
    }

    const wordCount = totalText.trim().split(/\s+/).length;
    const estimatedTokens = Math.ceil(wordCount * 1.3);

    return {
      totalTokens: estimatedTokens,
    };
  }

  async embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    const contents = Array.isArray(request.contents)
      ? request.contents
      : [request.contents];

    // Convert contents to strings
    const texts: string[] = [];
    for (const content of contents) {
      if (typeof content === 'string') {
        texts.push(content);
      } else if (typeof content === 'object' && content !== null && 'parts' in content) {
        const contentObj = content as Content;
        const parts = Array.isArray(contentObj.parts) ? contentObj.parts : [contentObj.parts];
        const text = parts
          .map((part) => (part && typeof part === 'object' && 'text' in part ? part.text || '' : ''))
          .join('');
        texts.push(text);
      }
    }

    const ollamaResponse = await this.client.embeddings({
      model: request.model,
      input: texts.length === 1 ? texts[0] : texts,
    });

    return {
      embeddings: ollamaResponse.embeddings.map((values) => ({ values })),
    };
  }

  private convertOllamaResponseToGenerateContentResponse(
    ollamaResponse: OllamaChatResponse,
  ): GenerateContentResponse {
    const content = ollamaMessageToContent(ollamaResponse.message);

    // Extract text from content
    const parts = content.parts ? (Array.isArray(content.parts) ? content.parts : [content.parts]) : [];
    const textParts = parts
      .filter((part) => part && typeof part === 'object' && 'text' in part)
      .map((part: any) => part.text)
      .join('');

    // Extract function calls from parts for top-level convenience property
    const functionCalls = parts
      .filter((part: any) => part.functionCall)
      .map((part: any) => part.functionCall);

    const response = {
      text: textParts,
      candidates: [
        {
          content,
          finishReason: ollamaResponse.done ? FinishReason.STOP : undefined,
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: ollamaResponse.prompt_eval_count,
        candidatesTokenCount: ollamaResponse.eval_count,
        totalTokenCount:
          (ollamaResponse.prompt_eval_count || 0) +
          (ollamaResponse.eval_count || 0),
      },
      // Add top-level functionCalls property to match Gemini SDK structure
      ...(functionCalls.length > 0 && { functionCalls }),
    } as GenerateContentResponse;

    return response;
  }
}
