/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  OllamaListResponse,
} from './types.js';

export interface OllamaClientConfig {
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export class OllamaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: OllamaClientConfig = {}) {
    this.apiKey = (config.apiKey || process.env['OLLAMA_API_KEY'] || '').trim();
    this.baseUrl =
      config.baseUrl || process.env['OLLAMA_BASE_URL'] || 'https://ollama.com';

    this.headers = {
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    };

    if (this.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
  }

  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<OllamaChatResponse>;
  }

  async *chatStream(
    request: OllamaChatRequest,
  ): AsyncGenerator<OllamaChatResponse> {
    const requestBody = { ...request, stream: true };

    // Debug logging for troubleshooting
    if (process.env['DEBUG'] || process.env['DEBUG_MODE']) {
      console.error('[OllamaClient] Request URL:', `${this.baseUrl}/api/chat`);
      console.error('[OllamaClient] Request model:', request.model);
      console.error(
        '[OllamaClient] Request has tools:',
        !!request.tools,
        request.tools?.length || 0,
      );
      console.error('[OllamaClient] Message count:', request.messages?.length);
      console.error(
        '[OllamaClient] Full request:',
        JSON.stringify(requestBody, null, 2).slice(0, 2000),
      );
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Include more context in error for debugging
      const debugInfo =
        process.env['DEBUG'] || process.env['DEBUG_MODE']
          ? ` [model: ${request.model}, url: ${this.baseUrl}]`
          : '';
      throw new Error(
        `Ollama API error (${response.status}): ${errorText}${debugInfo}`,
      );
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line) as OllamaChatResponse;
            yield data;
          }
        }
      }

      if (buffer.trim()) {
        const data = JSON.parse(buffer) as OllamaChatResponse;
        yield data;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async generate(
    request: OllamaGenerateRequest,
  ): Promise<OllamaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<OllamaGenerateResponse>;
  }

  async *generateStream(
    request: OllamaGenerateRequest,
  ): AsyncGenerator<OllamaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line) as OllamaGenerateResponse;
            yield data;
          }
        }
      }

      if (buffer.trim()) {
        const data = JSON.parse(buffer) as OllamaGenerateResponse;
        yield data;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async embeddings(
    request: OllamaEmbeddingRequest,
  ): Promise<OllamaEmbeddingResponse> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<OllamaEmbeddingResponse>;
  }

  async listModels(): Promise<OllamaListResponse> {
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<OllamaListResponse>;
  }
}
