# Authentication Fixes for Ollama

## Problem
When selecting "Use Ollama API Key" and entering an Ollama API key, the system was still trying to authenticate with Google's Gemini API (`generativelanguage.googleapis.com`), resulting in:
```
API key not valid. Please pass a valid API key.
```

## Root Causes

### 1. **API Key Storage Was Auth-Type Blind**
The `loadApiKey()` function loaded keys from a generic storage, but:
- For Gemini: checked BOTH `loadApiKey()` and `process.env['GEMINI_API_KEY']`
- For Ollama: ONLY checked `process.env['OLLAMA_API_KEY']`, ignoring stored keys

When a user entered their Ollama key via the UI, it was saved to storage but never loaded.

### 2. **Auth Validation Missing Ollama**
The `useAuth.ts` validation only checked for `AuthType.USE_GEMINI`:
```typescript
if (authType === AuthType.USE_GEMINI) {
  return null;  // Skip validation
}
```

Ollama auth would fail validation.

### 3. **API Key Reload Missing Ollama**
The `reloadApiKey()` function only checked `GEMINI_API_KEY` environment variable, not `OLLAMA_API_KEY`.

### 4. **Environment Variable Detection**
Auto-detection only looked for `GEMINI_API_KEY`, not `OLLAMA_API_KEY`.

## Fixes Applied

### Fix 1: Load Stored Keys for Ollama
**File**: `packages/core/src/core/contentGenerator.ts`

**Before**:
```typescript
const geminiApiKey = (await loadApiKey()) || process.env['GEMINI_API_KEY'] || undefined;
const ollamaApiKey = process.env['OLLAMA_API_KEY'] || undefined;
```

**After**:
```typescript
const storedApiKey = await loadApiKey();
const geminiApiKey = storedApiKey || process.env['GEMINI_API_KEY'] || undefined;
const ollamaApiKey = storedApiKey || process.env['OLLAMA_API_KEY'] || undefined;
```

Now both Gemini and Ollama check the stored key first.

### Fix 2: Add Ollama to Validation Bypass
**File**: `packages/cli/src/ui/auth/useAuth.ts`

**Before**:
```typescript
if (authType === AuthType.USE_GEMINI) {
  return null;
}
```

**After**:
```typescript
if (authType === AuthType.USE_GEMINI || authType === AuthType.USE_OLLAMA) {
  return null;
}
```

### Fix 3: Reload Keys by Auth Type
**File**: `packages/cli/src/ui/auth/useAuth.ts`

**Before**:
```typescript
const reloadApiKey = useCallback(async () => {
  const storedKey = (await loadApiKey()) ?? '';
  const envKey = process.env['GEMINI_API_KEY'] ?? '';
  const key = storedKey || envKey;
  ...
}, []);
```

**After**:
```typescript
const reloadApiKey = useCallback(async (authType?: AuthType) => {
  const storedKey = (await loadApiKey()) ?? '';
  let envKey = '';
  if (authType === AuthType.USE_OLLAMA) {
    envKey = process.env['OLLAMA_API_KEY'] ?? '';
  } else {
    envKey = process.env['GEMINI_API_KEY'] ?? '';
  }
  const key = storedKey || envKey;
  ...
}, []);
```

Now it checks the correct environment variable based on auth type.

### Fix 4: Auto-Detect Ollama Keys
**File**: `packages/cli/src/ui/auth/useAuth.ts`

**Before**:
```typescript
if (!authType) {
  if (process.env['GEMINI_API_KEY']) {
    onAuthError('Existing API key detected (GEMINI_API_KEY)...');
  } else {
    onAuthError('No authentication method selected.');
  }
}
```

**After**:
```typescript
if (!authType) {
  if (process.env['OLLAMA_API_KEY']) {
    onAuthError('Existing API key detected (OLLAMA_API_KEY). Select "Use Ollama API Key"...');
  } else if (process.env['GEMINI_API_KEY']) {
    onAuthError('Existing API key detected (GEMINI_API_KEY). Select "Gemini API Key"...');
  } else {
    onAuthError('No authentication method selected.');
  }
}
```

Checks for Ollama keys first.

### Fix 5: Auto-Select Ollama Auth
**File**: `packages/cli/src/ui/auth/AuthDialog.tsx`

**Before**:
```typescript
if (process.env['GEMINI_API_KEY']) {
  return item.value === AuthType.USE_GEMINI;
}
return item.value === AuthType.LOGIN_WITH_GOOGLE;
```

**After**:
```typescript
if (process.env['OLLAMA_API_KEY']) {
  return item.value === AuthType.USE_OLLAMA;
}
if (process.env['GEMINI_API_KEY']) {
  return item.value === AuthType.USE_GEMINI;
}
return item.value === AuthType.LOGIN_WITH_GOOGLE;
```

If `OLLAMA_API_KEY` is set, auto-selects Ollama auth.

### Fix 6: API Key Reload for Ollama
**File**: `packages/cli/src/ui/auth/useAuth.ts`

**Before**:
```typescript
if (authType === AuthType.USE_GEMINI) {
  const key = await reloadApiKey();
  if (!key) {
    setAuthState(AuthState.AwaitingApiKeyInput);
    return;
  }
}
```

**After**:
```typescript
if (authType === AuthType.USE_GEMINI || authType === AuthType.USE_OLLAMA) {
  const key = await reloadApiKey(authType);
  if (!key) {
    setAuthState(AuthState.AwaitingApiKeyInput);
    return;
  }
}
```

Both auth types now reload their keys properly.

## Testing the Fix

### Option 1: Using Environment Variable
```bash
export OLLAMA_API_KEY="your-ollama-key-here"
blackbox
# Should auto-select "Use Ollama API Key"
```

### Option 2: Via UI
```bash
blackbox
> /auth
# Select "Use Ollama API Key"
# Enter your key when prompted
# Should now use Ollama Cloud API instead of Google's API
```

### Verify It's Working
```bash
# After auth, try a simple command
> List files in current directory

# Should use Ollama's API (gpt-oss:120b-cloud by default)
# NOT Google's generativelanguage.googleapis.com
```

## Expected Behavior Now

1. **Storage**: Ollama keys saved via UI are loaded from storage ✅
2. **Environment**: `OLLAMA_API_KEY` env var is checked ✅
3. **Validation**: Ollama auth bypasses Google-specific validation ✅
4. **Auto-select**: If `OLLAMA_API_KEY` is set, auto-selects Ollama ✅
5. **API Client**: Uses `OllamaClient` → Ollama Cloud API ✅
6. **Model**: Uses Ollama models (DeepSeek, GPT-OSS, etc.) ✅

## Files Modified
- `packages/core/src/core/contentGenerator.ts`
- `packages/cli/src/ui/auth/useAuth.ts`
- `packages/cli/src/ui/auth/AuthDialog.tsx`
- `packages/core/src/core/prompts.ts`
- `packages/cli/src/ui/utils/updateCheck.ts`

## Rebuild Steps
```bash
npm run build
npm run bundle
npm link --force
```

## Summary
The authentication system now properly supports Ollama alongside Gemini. Keys can be provided via environment variables OR the UI, and the system will correctly create an `OllamaContentGenerator` that calls Ollama Cloud's API instead of Google's.
