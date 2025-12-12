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
    this.baseUrl = config.baseUrl || process.env['OLLAMA_BASE_URL'] || 'https://ollama.com';

    this.headers = {
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    };

    if (this.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
  }

  private parseJsonLine<T>(line: string): T | null {
    const trimmed = line.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = trimmed.startsWith('data:')
      ? trimmed.slice('data:'.length).trim()
      : trimmed;

    try {
      return JSON.parse(normalized) as T;
    } catch (_err) {
      // Ignore malformed lines; they'll be handled by retry/backoff upstream.
      return null;
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
      throw new Error(
        `Ollama API error (${response.status}): ${errorText}`,
      );
    }

    return response.json() as Promise<OllamaChatResponse>;
  }

  async *chatStream(
    request: OllamaChatRequest,
  ): AsyncGenerator<OllamaChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama API error (${response.status}): ${errorText}`,
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
          const data = this.parseJsonLine<OllamaChatResponse>(line);
          if (data) {
            yield data;
          }
        }
      }

      const finalData = this.parseJsonLine<OllamaChatResponse>(buffer);
      if (finalData) {
        yield finalData;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama API error (${response.status}): ${errorText}`,
      );
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
      throw new Error(
        `Ollama API error (${response.status}): ${errorText}`,
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
          const data = this.parseJsonLine<OllamaGenerateResponse>(line);
          if (data) {
            yield data;
          }
        }
      }

      const finalData = this.parseJsonLine<OllamaGenerateResponse>(buffer);
      if (finalData) {
        yield finalData;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async embeddings(request: OllamaEmbeddingRequest): Promise<OllamaEmbeddingResponse> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama API error (${response.status}): ${errorText}`,
      );
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
      throw new Error(
        `Ollama API error (${response.status}): ${errorText}`,
      );
    }

    return response.json() as Promise<OllamaListResponse>;
  }
}
