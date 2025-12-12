/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Content,
  Part,
  GenerateContentParameters,
  GenerateContentConfig,
  Tool,
  FunctionCall,
} from '@google/genai';
import type {
  OllamaMessage,
  OllamaTool,
  OllamaChatRequest,
  OllamaToolCall,
} from './types.js';

function parseArgs(rawArgs: unknown): Record<string, unknown> {
  if (typeof rawArgs === 'string') {
    try {
      return JSON.parse(rawArgs) as Record<string, unknown>;
    } catch (_err) {
      return { raw: rawArgs };
    }
  }

  if (rawArgs && typeof rawArgs === 'object') {
    return rawArgs as Record<string, unknown>;
  }

  return {};
}

function normalizeArgsForRequest(args: unknown): Record<string, unknown> {
  if (args === undefined || args === null) {
    return {};
  }

  if (typeof args === 'string') {
    try {
      return JSON.parse(args) as Record<string, unknown>;
    } catch (_err) {
      return { raw: args };
    }
  }

  if (typeof args === 'object') {
    return args as Record<string, unknown>;
  }

  return { value: args };
}

function formatFunctionResponseContent(response: unknown): string {
  if (response === undefined || response === null) {
    return '';
  }
  if (typeof response === 'string') {
    return response;
  }
  if (
    typeof response === 'object' &&
    response !== null &&
    'output' in (response as Record<string, unknown>) &&
    typeof (response as Record<string, unknown>)['output'] === 'string'
  ) {
    return (response as Record<string, unknown>)['output'] as string;
  }

  try {
    return JSON.stringify(response);
  } catch (_err) {
    return String(response);
  }
}

/**
 * Converts Gemini Content to Ollama Message format
 */
export function contentToOllamaMessage(content: Content): OllamaMessage {
  const role = mapRole(content.role || 'user');
  const parts = Array.isArray(content.parts) ? content.parts : [content.parts];

  let textContent = '';
  const images: string[] = [];
  const toolCalls: OllamaToolCall[] = [];
  let toolName: string | undefined;
  let toolCallId: string | undefined;

  for (const part of parts) {
    if (!part || typeof part !== 'object') continue;

    if ('text' in part && part.text) {
      textContent += part.text;
    } else if ('inlineData' in part && part.inlineData && part.inlineData.data) {
      // Convert inline data to base64 image
      images.push(part.inlineData.data);
    } else if ('functionCall' in part && part.functionCall) {
      // Convert function call to tool call
      const funcCall = part.functionCall;
      if (funcCall.name) {
        toolCalls.push({
          id: funcCall.id,
          function: {
            name: funcCall.name,
            arguments: normalizeArgsForRequest(funcCall.args),
          },
        });
      }
    } else if ('functionResponse' in part && part.functionResponse) {
      // For function responses, Ollama expects a tool role message with tool_name
      const response = part.functionResponse;
      toolName = response.name;
      toolCallId = response.id || response.name;
      textContent += formatFunctionResponseContent(response.response);
    }
  }

  const message: OllamaMessage = {
    role,
    content: textContent,
  };

  if (images.length > 0) {
    message.images = images;
  }

  if (toolCalls.length > 0) {
    message.tool_calls = toolCalls;
  }

  // Add tool_name for tool role messages (function responses)
  if (role === 'tool' && toolName) {
    message.tool_name = toolName;
    if (toolCallId) {
      message.tool_call_id = toolCallId;
    }
  }

  return message;
}

function mapRole(role: string): 'user' | 'assistant' | 'system' | 'tool' {
  switch (role) {
    case 'user':
      return 'user';
    case 'model':
      return 'assistant';
    case 'system':
      return 'system';
    case 'function':
      return 'tool';
    default:
      return 'user';
  }
}

/**
 * Converts Gemini Tools to Ollama Tools format
 */
export function geminiToolsToOllamaTools(tools?: Tool[] | unknown): OllamaTool[] | undefined {
  if (!tools || !Array.isArray(tools) || tools.length === 0) {
    return undefined;
  }

  return tools.flatMap((tool) => {
    if (!tool || typeof tool !== 'object' || !('functionDeclarations' in tool) || !tool.functionDeclarations) {
      return [];
    }

    return tool.functionDeclarations
      .filter((func: any) => func && func.name)
      .map((func: any) => ({
        type: 'function' as const,
        function: {
          name: func.name!,
          description: func.description || '',
          parameters: (func.parameters as Record<string, unknown>) || {},
        },
      }));
  });
}

/**
 * Converts Gemini GenerateContentConfig to Ollama options
 */
export function configToOllamaOptions(config?: GenerateContentConfig) {
  if (!config) {
    return undefined;
  }

  return {
    temperature: config.temperature,
    top_p: config.topP,
    top_k: config.topK,
    num_predict: config.maxOutputTokens,
    stop: config.stopSequences,
  };
}

/**
 * Converts GenerateContentParameters to OllamaChatRequest
 */
export function generateParamsToOllamaChatRequest(
  params: GenerateContentParameters,
): OllamaChatRequest {
  const messages: OllamaMessage[] = [];

  // Add system instruction as a system message if present
  if (params.config?.systemInstruction) {
    const systemInstruction = params.config.systemInstruction;
    let systemText = '';

    if (typeof systemInstruction === 'string') {
      systemText = systemInstruction;
    } else if (typeof systemInstruction === 'object' && systemInstruction !== null) {
      if ('parts' in systemInstruction) {
        systemText = contentToOllamaMessage(systemInstruction as Content).content;
      } else if (Array.isArray(systemInstruction)) {
        systemText = systemInstruction
          .map((part) => (part && typeof part === 'object' && 'text' in part ? part.text || '' : ''))
          .join('');
      } else if ('text' in systemInstruction && typeof systemInstruction.text === 'string') {
        systemText = systemInstruction.text;
      }
    }

    if (systemText) {
      messages.push({
        role: 'system',
        content: systemText,
      });
    }
  }

  // Convert contents to messages
  const contents = Array.isArray(params.contents)
    ? params.contents
    : [params.contents];

  for (const content of contents) {
    if (typeof content === 'object' && content !== null && 'parts' in content) {
      messages.push(contentToOllamaMessage(content as Content));
    }
  }

  const request: OllamaChatRequest = {
    model: params.model,
    messages,
    options: configToOllamaOptions(params.config),
    tools: geminiToolsToOllamaTools(params.config?.tools),
  };

  // Handle JSON schema response format
  if (params.config?.responseMimeType === 'application/json') {
    if (params.config.responseJsonSchema) {
      request.format = params.config.responseJsonSchema as Record<string, unknown>;
    } else {
      request.format = 'json';
    }
  }

  return request;
}

/**
 * Converts Ollama message back to Gemini Content format
 */
export function ollamaMessageToContent(message: OllamaMessage): Content {
  const parts: Part[] = [];

  const isToolResponse = message.role === 'tool' && !!message.tool_call_id;

  // Add text content (skip for tool responses where we provide a functionResponse)
  if (message.content && !isToolResponse) {
    parts.push({ text: message.content });
  }

  // Add function calls if present
  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      parts.push({
        functionCall: {
          id: toolCall.id,
          name: toolCall.function.name,
          args: parseArgs(toolCall.function.arguments),
        } as FunctionCall,
      });
    }
  }

  if (isToolResponse) {
    parts.push({
      functionResponse: {
        name: message.tool_name ?? 'tool',
        id: message.tool_call_id,
        response: { output: message.content },
      },
    });
  }

  return {
    role:
      message.role === 'assistant'
        ? 'model'
        : message.role === 'tool'
          ? 'function'
          : message.role,
    parts,
  };
}
