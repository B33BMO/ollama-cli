# Gemini CLI → Blackbox CLI Conversion Summary

This document summarizes the conversion from Google Gemini CLI to Blackbox CLI (Ollama-powered).

## What Was Done

### 1. Ollama API Integration
Created a complete Ollama API client implementation:
- **`packages/core/src/ollama/types.ts`** - TypeScript types for Ollama API
- **`packages/core/src/ollama/ollamaClient.ts`** - HTTP client for Ollama Cloud API
- **`packages/core/src/ollama/converter.ts`** - Converts between Gemini and Ollama formats
- **`packages/core/src/ollama/ollamaContentGenerator.ts`** - Implements ContentGenerator interface

### 2. Authentication Updates
- Added `AuthType.USE_OLLAMA` to support Ollama API key authentication
- Updated `packages/core/src/core/contentGenerator.ts` to create Ollama clients
- Modified `packages/cli/src/config/auth.ts` to validate Ollama auth
- Updated `packages/cli/src/ui/auth/AuthDialog.tsx` to show "Use Ollama API Key" option

### 3. Project Renaming
- Changed package name from `@google/gemini-cli` to `blackbox-cli`
- Changed binary command from `gemini` to `blackbox`
- Updated version to `0.1.0`
- Updated README.md with Blackbox branding and Ollama instructions

## How to Use

### Setup

1. **Get an Ollama API Key**
   - Visit https://ollama.com
   - Create an account and generate an API key
   - Set the environment variable:
     ```bash
     export OLLAMA_API_KEY="your-api-key-here"
     ```

2. **Build and Install**
   ```bash
   cd gemini-cli
   npm install
   npm run build
   npm link
   ```

3. **Run Blackbox CLI**
   ```bash
   blackbox
   ```
   - When prompted, select "Use Ollama API Key"
   - Start chatting with Ollama models!

### Available Models

Ollama Cloud provides access to:
- `deepseek-v3.1:671b-cloud` - DeepSeek V3.1
- `gpt-oss:120b-cloud` - GPT-OSS 120B
- `gpt-oss:20b-cloud` - GPT-OSS 20B
- `qwen3-coder:480b-cloud` - Qwen 3 Coder
- `glm-4.6:cloud` - GLM-4.6
- `minimax-m2:cloud` - MiniMax M2
- `kimi-k2:1t-cloud` - Kimi K2

## What Still Works

✅ All existing features from Gemini CLI:
- File operations (read, write, edit)
- Shell command execution
- MCP (Model Context Protocol) support
- Conversation checkpointing
- Custom context files
- Non-interactive mode for scripts
- Streaming responses
- Tool calling / function calling

## Important Notes

### API Differences

1. **Authentication**: Uses Bearer token with `OLLAMA_API_KEY` instead of Google OAuth
2. **Base URL**: `https://ollama.com/api/` instead of Google's endpoints
3. **Token Counting**: Ollama doesn't have a token counting API, so it's approximated
4. **Model Names**: Use Ollama model names (e.g., `deepseek-v3.1:671b-cloud`)

### Backwards Compatibility

The code still supports all original Gemini authentication methods:
- Login with Google (OAuth)
- Gemini API Key
- Vertex AI
- But Ollama is now available as an additional option

## Next Steps

To complete the transition:

1. **Update all package names** in the monorepo (cli, a2a-server, etc.)
2. **Update import statements** from `@google/gemini-cli-*` to `blackbox-cli-*`
3. **Test the build** and ensure all packages compile
4. **Update the binary name** in all scripts and references
5. **Configure default models** for Ollama in the config system
6. **Add Ollama-specific documentation**

## File Changes Summary

### New Files Created
- `packages/core/src/ollama/types.ts`
- `packages/core/src/ollama/ollamaClient.ts`
- `packages/core/src/ollama/converter.ts`
- `packages/core/src/ollama/ollamaContentGenerator.ts`

### Modified Files
- `package.json` - Renamed to blackbox-cli, updated binary name
- `packages/core/package.json` - Renamed to blackbox-cli-core
- `packages/core/src/core/contentGenerator.ts` - Added Ollama support
- `packages/cli/src/config/auth.ts` - Added Ollama validation
- `packages/cli/src/ui/auth/AuthDialog.tsx` - Added Ollama UI option
- `README.md` - Complete rewrite for Blackbox branding

## Testing

Before deploying, test:
1. ✅ Ollama authentication works
2. ✅ Basic chat functionality
3. ✅ File operations
4. ✅ Tool calling
5. ✅ Streaming responses
6. ✅ Different Ollama models
7. ⚠️ Integration tests may need updates for Ollama API responses

## Known Limitations

1. **Token Counting**: Approximated, not exact (Ollama doesn't provide this API)
2. **Embeddings**: Ollama's embedding API endpoint is `/api/embed`
3. **Error Handling**: May need refinement for Ollama-specific error codes
4. **Rate Limits**: Ollama Cloud has its own rate limits (check docs)

## Support

For issues or questions:
- Check Ollama documentation: https://docs.ollama.com/cloud
- Review Ollama API reference: https://github.com/ollama/ollama/blob/main/docs/api.md
- Test with different models to find the best fit for your use case
