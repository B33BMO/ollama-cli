/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { Content } from '@google/genai';
import { FinishReason } from '@google/genai';
import {
  contentToOllamaMessage,
  ollamaMessageToContent,
} from './converter.js';
import { OllamaContentGenerator } from './ollamaContentGenerator.js';

describe('Ollama converters', () => {
  it('preserves tool call ids and parses JSON argument strings', () => {
    const content: Content = {
      role: 'model',
      parts: [
        {
          functionCall: {
            id: 'call_1',
            name: 'doThing',
            args: { foo: 'bar' },
          },
        },
      ],
    };

    const message = contentToOllamaMessage(content);
    expect(message.tool_calls?.[0]?.id).toBe('call_1');
    expect(typeof message.tool_calls?.[0]?.function.arguments).toBe('string');

    const roundTripped = ollamaMessageToContent({
      role: 'assistant',
      content: '',
      tool_calls: [
        {
          id: 'call_1',
          function: { name: 'doThing', arguments: '{"foo":"bar"}' },
        },
      ],
    });

    const functionCall = roundTripped.parts?.[0]?.functionCall;
    expect(functionCall?.id).toBe('call_1');
    expect(functionCall?.args).toEqual({ foo: 'bar' });
  });

  it('maps function responses to tool messages with tool_call_id', () => {
    const content: Content = {
      role: 'function',
      parts: [
        {
          functionResponse: {
            id: 'call_2',
            name: 'doThing',
            response: { output: 'ok' },
          },
        },
      ],
    };

    const message = contentToOllamaMessage(content);
    expect(message.role).toBe('tool');
    expect(message.tool_name).toBe('doThing');
    expect(message.tool_call_id).toBe('call_2');
    expect(message.content).toBe('ok');

    const back = ollamaMessageToContent(message);
    const fnResponse = back.parts?.find((p) => p.functionResponse)?.functionResponse;
    expect(fnResponse?.id).toBe('call_2');
    expect(fnResponse?.response).toEqual({ output: 'ok' });
  });

  it('handles streaming responses without a message payload', () => {
    const generator = new OllamaContentGenerator({} as any);
    const response = (generator as any).convertOllamaResponseToGenerateContentResponse({
      model: 'dummy',
      created_at: new Date().toISOString(),
      done: true,
      prompt_eval_count: 1,
      eval_count: 2,
      message: undefined,
    });

    expect(response.candidates?.[0]?.finishReason).toBe(FinishReason.STOP);
    expect(response.candidates?.[0]?.content.parts?.length ?? 0).toBe(0);
    expect(response.usageMetadata?.promptTokenCount).toBe(1);
    expect(response.usageMetadata?.candidatesTokenCount).toBe(2);
  });
});
