# Ollama Integration Summary

## Overview

This document provides a comprehensive summary of how Ollama is integrated into the Gemini CLI codebase for tool calling, system prompts, streaming, and more.

---

## 1. API CALLS AND ENDPOINTS

**File**: `packages/core/src/ollama/ollamaClient.ts`

The Ollama API client makes HTTP calls to the following endpoints:

| Endpoint | Method | Purpose | Lines |
|----------|--------|---------|-------|
| `/api/chat` | POST | Chat completion (non-streaming) | 43-56 |
| `/api/chat` | POST | Chat completion (streaming) | 62-107 |
| `/api/generate` | POST | Text generation (non-streaming) | 110-124 |
| `/api/generate` | POST | Text generation (streaming) | 129-174 |
| `/api/embed` | POST | Generate embeddings | 177-191 |
| `/api/tags` | GET | List available models | 194-207 |

### Base URL Configuration (lines 29-30)
- Default: `https://ollama.com` (Ollama Cloud)
- Overridable via:
  1. **Settings (recommended)**: Set `ollama.baseUrl` in `settings.json`
  2. **Environment variable**: `OLLAMA_BASE_URL`
  3. **Programmatic**: Pass `baseUrl` to `OllamaClient` constructor
- For self-hosted: Set to `http://localhost:11434` or your custom domain

### Authentication (lines 37-39)
- Bearer token via `Authorization: Bearer ${apiKey}` header
- API key from `process.env['OLLAMA_API_KEY']` or `config.apiKey` parameter

---

## 2. TOOL CALLING IMPLEMENTATION

**Files**:
- `packages/core/src/ollama/converter.ts` (lines 101-122)
- `packages/core/src/ollama/types.ts` (lines 20-34)

### Tool Definition Structure

```typescript
// From converter.ts: geminiToolsToOllamaTool (lines 101-122)
export function geminiToolsToOllamaTools(tools?: Tool[]): OllamaTool[] | undefined {
  // Converts Gemini Tool[] format to Ollama format
  return tools.flatMap((tool) => {
    return tool.functionDeclarations.map((func) => ({
      type: 'function',
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters  // JSON Schema
      }
    }));
  });
}
```

### Tool Call Handling (converter.ts)
- **Outgoing** (lines 42-52): Converts Gemini `functionCall` parts to Ollama `tool_calls` format
- **Incoming** (lines 218-226): Converts Ollama `tool_calls` back to Gemini `functionCall` parts

### Tool Response Handling (converter.ts, lines 53-59)
- Role mapping: `'function'` → `'tool'`
- Response content serialized as JSON string in message content
- Tool name stored in `tool_name` field for responses

---

## 3. SYSTEM PROMPTS STRUCTURE

**File**: `packages/core/src/ollama/converter.ts` (lines 144-204)

### System Instruction Handling (lines 149-174)

```typescript
// From generateParamsToOllamaChatRequest
if (params.config?.systemInstruction) {
  let systemText = '';
  // Handles: string, Content object, or array of parts
  messages.push({
    role: 'system',
    content: systemText
  });
}
```

### Message Structure (lines 176-185)
- System message added first (if present)
- Content messages converted via `contentToOllamaMessage()`
- All messages collected in `OllamaChatRequest.messages[]` array

### Message Conversion (lines 25-81)
- Role mapping: `'model'` → `'assistant'`, `'function'` → `'tool'`, others unchanged
- Text content extracted and concatenated
- Inline data (images) converted to base64
- Function calls converted to tool calls format

---

## 4. OVERALL ARCHITECTURE

### Layer 1: Client Interface
**File**: `packages/core/src/ollama/ollamaClient.ts` (23-208)
- Raw HTTP client for Ollama API
- Methods: `chat()`, `chatStream()`, `generate()`, `generateStream()`, `embeddings()`, `listModels()`
- Error handling with status codes and error text

### Layer 2: Content Generator
**File**: `packages/core/src/ollama/ollamaContentGenerator.ts` (25-159)
- Implements `ContentGenerator` interface
- Adapts Ollama client to Gemini SDK contract
- Methods:
  - `generateContent()` - Single response (line 32-40)
  - `generateContentStream()` - Streaming responses (line 42-56)
  - `countTokens()` - Approximates via word count × 1.3 (lines 58-88)
  - `embedContent()` - Embedding generation (lines 90-118)

### Layer 3: Converter
**File**: `packages/core/src/ollama/converter.ts` (1-234)
- Bidirectional conversion between Gemini and Ollama formats
- Key functions:
  - `contentToOllamaMessage()` - Gemini Content → Ollama Message
  - `geminiToolsToOllamaTools()` - Tool definitions conversion
  - `generateParamsToOllamaChatRequest()` - Full request conversion
  - `ollamaMessageToContent()` - Response conversion
  - `configToOllamaOptions()` - Generation config mapping

### Layer 4: Logging Wrapper
**File**: `packages/core/src/core/loggingContentGenerator.ts` (44-48)
- Wraps `OllamaContentGenerator`
- Logs all API requests/responses for telemetry

### Layer 5: Factory & Configuration
**File**: `packages/core/src/core/contentGenerator.ts` (176-185)
- `createContentGenerator()` instantiates Ollama when `authType === AuthType.USE_OLLAMA`
- Creates `OllamaClient` → `OllamaContentGenerator` → `LoggingContentGenerator` chain

---

## 5. CONFIGURATION AND SETUP

### Authentication Type Enum
**File**: `packages/core/src/core/contentGenerator.ts` (line 53)

```typescript
enum AuthType {
  USE_OLLAMA = 'ollama-api-key',
  // ... other types
}
```

### Environment Variables
1. `OLLAMA_API_KEY` - The API key for authentication (checked in lines 29, 62, 76, 79)
2. `OLLAMA_BASE_URL` - Base URL override (default: `https://ollama.com`, line 30)

### Settings Configuration (settings.json)
Configure Ollama via the settings dialog (`/settings`) or directly in `settings.json`:

```json
{
  "ollama": {
    "baseUrl": "http://localhost:11434"
  }
}
```

**Available Settings:**
- `ollama.baseUrl` - The base URL for the Ollama API (e.g., `http://localhost:11434` for local, or a custom domain)

**Priority Order:**
1. `settings.json` → `ollama.baseUrl`
2. Environment variable → `OLLAMA_BASE_URL`
3. Default → `https://ollama.com`

### Configuration Factory
**File**: `packages/core/src/core/contentGenerator.ts`
- `createContentGeneratorConfig()` (lines 65-121):
  - Loads stored API key via `loadApiKey()`
  - Checks `OLLAMA_API_KEY` env var (line 76)
  - Creates `ContentGeneratorConfig` with `authType: USE_OLLAMA` (line 114)

### UI Configuration
- `packages/cli/src/ui/auth/AuthDialog.tsx` (lines 76-80):
  - Shows "Use Ollama API Key" option in auth dialog
- `packages/cli/src/ui/auth/ApiAuthDialog.tsx` (lines 34-80):
  - Prompts user for Ollama API key
  - Points to `https://ollama.com` for key generation
  - Auto-selects Ollama if `OLLAMA_API_KEY` env var is set (line 36)

---

## 6. RESPONSE PARSING AND HANDLING

### Chat Response Type
**File**: `packages/core/src/ollama/types.ts` (lines 53-65)

```typescript
export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;        // The actual response
  done: boolean;                  // Completion flag
  done_reason?: string;           // Reason for stopping
  prompt_eval_count?: number;     // Input tokens
  eval_count?: number;            // Output tokens
  // ... timing metadata
}
```

### Response Conversion
**File**: `packages/core/src/ollama/ollamaContentGenerator.ts` (lines 120-158)

```typescript
private convertOllamaResponseToGenerateContentResponse(
  ollamaResponse: OllamaChatResponse
): GenerateContentResponse {
  // Extract message content
  const content = ollamaMessageToContent(ollamaResponse.message);

  // Map tokens
  usageMetadata: {
    promptTokenCount: ollamaResponse.prompt_eval_count,
    candidatesTokenCount: ollamaResponse.eval_count,
    totalTokenCount: (eval_count || 0) + (prompt_eval_count || 0)
  }

  // Set finish reason
  finishReason: ollamaResponse.done ? FinishReason.STOP : undefined
}
```

### Error Handling
**File**: `packages/core/src/ollama/ollamaClient.ts` (lines 49-54, 68-72, etc.)

```typescript
if (!response.ok) {
  const errorText = await response.text();
  throw new Error(
    `Ollama API error (${response.status}): ${errorText}`
  );
}
```

---

## 7. STREAMING IMPLEMENTATION

### Streaming Architecture: Two-tier streaming

### Tier 1: OllamaClient Streaming
**File**: `packages/core/src/ollama/ollamaClient.ts`
- `chatStream()` (lines 59-107): Streams `/api/chat` responses
- `generateStream()` (lines 126-174): Streams `/api/generate` responses

### Stream Processing (lines 79-107 for chatStream)

```typescript
async *chatStream(request: OllamaChatRequest): AsyncGenerator<OllamaChatResponse> {
  const response = await fetch(`${this.baseUrl}/api/chat`, {
    body: JSON.stringify({ ...request, stream: true })  // Enable streaming
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';  // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        const data = JSON.parse(line) as OllamaChatResponse;
        yield data;  // Yield each chunk
      }
    }
  }

  if (buffer.trim()) {
    yield JSON.parse(buffer);  // Yield final line
  }
}
```

### Tier 2: ContentGenerator Streaming
**File**: `packages/core/src/ollama/ollamaContentGenerator.ts` (lines 42-56)

```typescript
async generateContentStream(
  request: GenerateContentParameters,
  userPromptId: string
): Promise<AsyncGenerator<GenerateContentResponse>> {
  const ollamaRequest = generateParamsToOllamaChatRequest(request);

  async function* streamGenerator(): AsyncGenerator<GenerateContentResponse> {
    for await (const ollamaResponse of self.client.chatStream(ollamaRequest)) {
      yield self.convertOllamaResponseToGenerateContentResponse(ollamaResponse);
    }
  }

  return streamGenerator();
}
```

### Line-Delimited JSON
Ollama streams responses as newline-delimited JSON:
- Each line is a complete `OllamaChatResponse` object
- Handled by splitting on `\n` (line 89)
- Incomplete lines kept in buffer for next chunk (line 90)

---

## 8. KEY TYPE DEFINITIONS

**File**: `packages/core/src/ollama/types.ts`

| Type | Purpose | Key Fields |
|------|---------|-----------|
| `OllamaMessage` | Message in conversation | `role`, `content`, `images?`, `tool_calls?`, `tool_name?` |
| `OllamaToolCall` | Invoked tool/function | `function.name`, `function.arguments` |
| `OllamaTool` | Tool definition | `type: 'function'`, `function` object |
| `OllamaChatRequest` | Chat API request | `model`, `messages[]`, `tools?`, `options?`, `format?` |
| `OllamaChatResponse` | Chat API response | `message`, `done`, token counts |
| `OllamaGenerateRequest` | Generate API request | `model`, `prompt`, `system?`, `images?` |
| `OllamaGenerateResponse` | Generate API response | `response`, `done`, token counts |
| `OllamaEmbeddingRequest` | Embedding request | `model`, `input` (string or array) |
| `OllamaEmbeddingResponse` | Embedding response | `embeddings: number[][]` |

---

## 9. CONFIGURATION MAPPING

### Generation Config to Ollama Options
**File**: `packages/core/src/ollama/converter.ts` (lines 127-139)

```typescript
export function configToOllamaOptions(config?: GenerateContentConfig) {
  return {
    temperature: config.temperature,        // Generation randomness
    top_p: config.topP,                     // Nucleus sampling
    top_k: config.topK,                     // Top-K sampling
    num_predict: config.maxOutputTokens,    // Max output length
    stop: config.stopSequences               // Stop tokens
  };
}
```

### JSON Response Format
**File**: `packages/core/src/ollama/converter.ts` (lines 195-201)

```typescript
if (params.config?.responseMimeType === 'application/json') {
  if (params.config.responseJsonSchema) {
    request.format = params.config.responseJsonSchema;  // Custom schema
  } else {
    request.format = 'json';  // Just request JSON
  }
}
```

---

## 10. FILE STRUCTURE SUMMARY

```
packages/core/src/ollama/
├── ollamaClient.ts              [Lines 1-209]   Raw HTTP client
├── ollamaContentGenerator.ts     [Lines 1-160]   Content Generator adapter
├── converter.ts                  [Lines 1-234]   Gemini ↔ Ollama conversion
└── types.ts                      [Lines 1-124]   Type definitions

packages/core/src/core/
├── contentGenerator.ts           [Lines 176-185] Factory for OllamaContentGenerator
└── loggingContentGenerator.ts    [Lines 44-48]   Logging wrapper

packages/cli/src/ui/auth/
├── AuthDialog.tsx                [Lines 76-80]   Ollama option in auth UI
├── ApiAuthDialog.tsx             [Lines 34-80]   Ollama key input dialog
└── useAuth.ts                    [Lines 30-95]   Auth state management
```

---

## 11. CRITICAL IMPLEMENTATION NOTES

### Token Counting Approximation
**File**: `packages/core/src/ollama/ollamaContentGenerator.ts` (line 83)
- Since Ollama doesn't have a token counting API
- Estimates as: `Math.ceil(wordCount * 1.3)` (typical English text ratio)

### Role Conversion
**File**: `packages/core/src/ollama/converter.ts` (lines 83-96)

```
Gemini → Ollama:
'user'     → 'user'
'model'    → 'assistant'
'system'   → 'system'
'function' → 'tool'
```

### Known Limitations
- No native token counting in Ollama API
- Response format is line-delimited JSON for streaming
- Base URL defaults to Ollama Cloud, not local instances

---

## Quick Reference

### Basic Request Flow

```typescript
// 1. Create Ollama client
const client = new OllamaClient({
  apiKey: process.env.OLLAMA_API_KEY,
  baseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.com'
});

// 2. Prepare chat request
const request: OllamaChatRequest = {
  model: 'llama3',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          }
        }
      }
    }
  ]
};

// 3. Call API (streaming)
for await (const response of client.chatStream(request)) {
  console.log(response.message.content);

  // Handle tool calls
  if (response.message.tool_calls) {
    for (const toolCall of response.message.tool_calls) {
      console.log(`Calling: ${toolCall.function.name}`);
      console.log(`Args: ${toolCall.function.arguments}`);
    }
  }
}
```

---

This comprehensive integration allows the Gemini CLI to seamlessly switch between Google's Gemini API and Ollama's API while maintaining the same interface for upper layers of the application.
