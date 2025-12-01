# CRITICAL BUG: Still Using Google API Despite Ollama Selection

## Problem
Even after selecting "Use Ollama API Key" and entering an Ollama API key, the system **STILL calls Google's Gemini API** (`generativelanguage.googleapis.com`) instead of Ollama Cloud API.

## Evidence
Error message:
```
API Error: {
  "error": {
    "code": 400,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_INVALID",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com"  ← WRONG! Should be ollama.com
        }
      }
    ]
  }
}
```

The `generativelanguage.googleapis.com` indicates it's calling Google's API, not Ollama's.

## Root Cause Analysis

### What SHOULD Happen:
1. User selects "Use Ollama API Key" from `/auth`
2. User enters Ollama API key
3. Key is saved to storage
4. `config.refreshAuth(AuthType.USE_OLLAMA)` is called
5. A new `ContentGeneratorConfig` is created with `authType: USE_OLLAMA`
6. `createContentGenerator()` creates an `OllamaContentGenerator`
7. Requests go to `https://ollama.com/api/*`

### What's ACTUALLY Happening:
1-4. ✅ Working correctly
5. ❓ ContentGeneratorConfig is created...
6. ❌ But somehow using GoogleGenAI instead of OllamaContentGenerator
7. ❌ Requests go to Google's API

## Investigation Needed

### Check 1: Is the auth type being saved correctly?
```bash
cat ~/.gemini/settings.json | grep -A 5 "auth"
```

**Expected**:
```json
"auth": {
  "selectedType": "ollama-api-key"
}
```

### Check 2: Is config.refreshAuth() working?
The `config.refreshAuth(authType)` method should:
1. Call `createContentGeneratorConfig(config, authType)`
2. Call `createContentGenerator(generatorConfig, config)`
3. Replace the old content generator with the new one

**Question**: Is the content generator being cached or reused instead of recreated?

### Check 3: Is the authType check case-sensitive?
In `createContentGenerator()`:
```typescript
if (config.authType === AuthType.USE_OLLAMA) {
  const ollamaClient = new OllamaClient({...});
  return new LoggingContentGenerator(
    new OllamaContentGenerator(ollamaClient),
    gcConfig,
  );
}
```

**Verify**: `config.authType` actually equals `AuthType.USE_OLLAMA` when running

### Check 4: Is there a fallback to Gemini?
Check if there's code that falls back to Gemini auth when Ollama auth "fails".

### Check 5: Is the Google SDK being imported even for Ollama?
The `GoogleGenAI` class might be instantiated regardless of auth type.

## Debugging Steps

### 1. Add Debug Logging
In `packages/core/src/core/contentGenerator.ts`, add logging:

```typescript
export async function createContentGenerator(
  config: ContentGeneratorConfig,
  gcConfig: Config,
  sessionId?: string,
): Promise<ContentGenerator> {
  console.log('[DEBUG] createContentGenerator called with authType:', config.authType);
  console.log('[DEBUG] AuthType.USE_OLLAMA =', AuthType.USE_OLLAMA);
  console.log('[DEBUG] Match?', config.authType === AuthType.USE_OLLAMA);

  const generator = await (async () => {
    // ... rest of the code

    if (config.authType === AuthType.USE_OLLAMA) {
      console.log('[DEBUG] Creating OllamaContentGenerator!');
      const ollamaClient = new OllamaClient({
        apiKey: config.apiKey,
        headers: baseHeaders,
      });
      return new LoggingContentGenerator(
        new OllamaContentGenerator(ollamaClient),
        gcConfig,
      );
    }

    console.log('[DEBUG] Did NOT match USE_OLLAMA, falling through...');

    throw new Error(
      `Error creating contentGenerator: Unsupported authType: ${config.authType}`,
    );
  })();
```

### 2. Run and Check Output
```bash
export DEBUG=1
blackbox
> /auth
# Select Ollama, enter key
# Watch the console for debug logs
```

### 3. Check if Generator is Recreated
The generator might be created once at startup and never recreated when auth changes.

**File to check**: Where `config.refreshAuth()` is implemented

## Potential Fixes

### Fix Option 1: Force Generator Recreation
Ensure that when `refreshAuth()` is called, it:
1. Destroys the old content generator
2. Creates a new one from scratch
3. Updates all references to use the new generator

### Fix Option 2: Check Auth Type Enum Value
Verify that `AuthType.USE_OLLAMA = 'ollama-api-key'` matches what's stored in settings.

### Fix Option 3: Clear Any Cached Generators
If there's a generator cache, clear it when auth type changes.

## What We've Fixed So Far

✅ API key storage loads for Ollama
✅ Auth validation includes Ollama
✅ Key reload checks OLLAMA_API_KEY
✅ Auto-detects and auto-selects Ollama
✅ Dialog shows "Enter Ollama API Key" correctly

❌ **Still using Google's API instead of Ollama API** ← THE CRITICAL BUG

## Next Steps

1. Add debug logging to `createContentGenerator()`
2. Verify `config.authType` value at runtime
3. Check if generator is being recreated on auth change
4. Trace the request to see where it's being sent to Google
5. Find and fix the code path that's using GoogleGenAI instead of OllamaClient

## User Workaround (Until Fixed)

**None available**. The Ollama auth path is fundamentally broken - it accepts the key but doesn't use it correctly.

**Temporary Solution**: Set up your own local Ollama instance and use that instead of Ollama Cloud (requires different implementation).

## Files to Investigate

1. `packages/core/src/core/contentGenerator.ts` - createContentGenerator()
2. `packages/core/src/config/config.ts` - refreshAuth() method
3. `packages/cli/src/ui/auth/useAuth.ts` - After key submission
4. `packages/core/src/core/client.ts` - Where requests are made

## Timeline

- Initial conversion: Ollama API client created ✅
- Authentication updates: Auth type added ✅
- API key storage: Fixed to load Ollama keys ✅
- Dialog fixes: Shows correct UI ✅
- **CRITICAL BUG DISCOVERED**: Still calls Google API ❌
- Status: **NEEDS IMMEDIATE FIX**

---

**This document tracks the most critical remaining issue preventing Blackbox CLI from working with Ollama Cloud.**
