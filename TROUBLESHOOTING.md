# Blackbox CLI Troubleshooting Guide

## Issue: CLI Hangs When Making Requests

### Symptoms
- CLI starts fine
- You can type messages
- But when you ask it to do something (like list directory), it hangs/freezes
- No response or output

### Likely Causes

#### 1. **Ollama API Key Not Set** ⚠️ MOST COMMON
The CLI cannot connect to Ollama Cloud without an API key.

**Solution:**
```bash
# Set your Ollama API key
export OLLAMA_API_KEY="your-api-key-here"

# Then restart blackbox
blackbox
```

#### 2. **Wrong Auth Method Selected**
You might have selected a different auth method (like "Login with Google") instead of "Use Ollama API Key".

**Solution:**
```bash
# Run the auth command
blackbox
> /auth

# Select "Use Ollama API Key" from the menu
```

#### 3. **Network/API Issues**
Ollama Cloud API might be down or unreachable.

**Test API Connection:**
```bash
curl https://ollama.com/api/tags \
  -H "Authorization: Bearer $OLLAMA_API_KEY"
```

If this returns an error, check:
- Your internet connection
- Ollama Cloud status
- API key validity

#### 4. **Model Not Available**
The default model might not be accessible with your API key.

**Try a different model:**
```bash
blackbox --model gpt-oss:20b-cloud
```

## Issue: Still Says "Gemini" Instead of "Blackbox"

### Solution
Rebuild the bundle:
```bash
cd /path/to/gemini-cli
npm run bundle
npm link --force
```

## Issue: "What model are you?" Returns Wrong Model

### Cause
The model is using its own internal knowledge instead of what we told it.

### Current Fix
The system prompt now says "You are Blackbox CLI, powered by Ollama Cloud".

After rebuilding, the model should identify correctly.

## Debugging Steps

### 1. Check Environment Variables
```bash
echo $OLLAMA_API_KEY  # Should show your API key
echo $OLLAMA_BASE_URL  # Should be empty or https://ollama.com
```

### 2. Check Auth Settings
```bash
# Look at your settings
cat ~/.gemini/settings.json | grep -A 3 "auth"
```

### 3. Enable Debug Logging
```bash
# Set debug mode
export DEBUG=1
blackbox
```

### 4. Test Ollama API Directly
```bash
# Test chat endpoint
curl -X POST https://ollama.com/api/chat \
  -H "Authorization: Bearer $OLLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss:20b-cloud",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

If this works, the Ollama API is accessible. If not, there's an API/auth issue.

## Quick Checklist

Before reporting a bug, verify:

- [ ] `OLLAMA_API_KEY` is set in your environment
- [ ] You selected "Use Ollama API Key" in the auth dialog
- [ ] You can curl the Ollama API successfully
- [ ] You've rebuilt after the latest changes: `npm run bundle`
- [ ] The model name is valid (try `gpt-oss:20b-cloud`)

## Common Error Messages

### "Operation not permitted"
- You're in sandbox mode
- See system prompt about sandboxing

### "Failed to generate content"
- API key issue
- Check OLLAMA_API_KEY is set and valid

### Request hangs forever
- Network issue or API is down
- Try with `--model gpt-oss:20b-cloud` for a smaller model

## Getting an Ollama API Key

1. Visit https://ollama.com
2. Sign up or log in
3. Go to Settings
4. Create an API key
5. Copy it to your environment:
   ```bash
   export OLLAMA_API_KEY="your-key"
   # Add to ~/.bashrc or ~/.zshrc to persist
   ```

## Still Having Issues?

1. Check the conversion summary: `cat FINAL_CONVERSION_SUMMARY.md`
2. Review the code changes
3. Try using Gemini auth instead (if you have a Gemini API key) to verify the CLI works
4. Report the issue with debug logs

## Debug Mode Output

To get detailed logs:
```bash
export DEBUG=1
export VERBOSE=true
blackbox 2>&1 | tee debug.log
```

This will show:
- API requests being made
- Response status codes
- Error details
- Tool call information
