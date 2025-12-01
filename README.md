# Ollama CLI
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/eda6e2e6-c5cc-4045-8b71-a90c4daa1ab3" />

[![License](https://img.shields.io/github/license/google-gemini/gemini-cli)](https://github.com/google-gemini/gemini-cli/blob/main/LICENSE)

Ollama CLI is an open-source AI agent powered by Ollama Cloud that brings powerful
language models directly into your terminal. Originally based on Gemini CLI, it has been
converted to use Ollama's cloud API, providing access to open-source models like
DeepSeek, GPT-OSS, Qwen, and more.
<img width="1711" height="564" alt="image" src="https://github.com/user-attachments/assets/b9654377-5b5f-4f31-b5de-60b55c04792c" />

## Why Ollama CLI?

- **Ollama Cloud**: Access to powerful open-source models via Ollama's cloud service
- **Multiple Models**: DeepSeek V3.1, GPT-OSS, Qwen, GLM-4.6, and more
- **Built-in tools**: File operations, shell commands, web fetching
- **Extensible**: MCP (Model Context Protocol) support for custom integrations
- **Terminal-first**: Designed for developers who live in the command line
- **Open source**: Apache 2.0 licensed

## Installation

### Pre-requisites

- Node.js version 20 or higher
- macOS, Linux, or Windows
- Ollama Cloud API key (get one from https://ollama.com)

### Quick Install

#### Install from source

```bash
# Clone the repository
git clone https://github.com/b33bmo/ollama-cli-.git
cd ollama-cli-

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link
```

## Authentication

Ollama CLI uses Ollama Cloud for model access. You'll need an Ollama API key.

### Get Your API Key

1. Visit [https://ollama.com](https://ollama.com)
2. Sign up or log in to your account
3. Navigate to Settings and create an API key
4. Set the environment variable:

```bash
export OLLAMA_API_KEY="your-api-key-here"
```

### Usage

```bash
# Start Blackbox CLI
blackbox

# Select "Use Ollama API Key" when prompted
# Or set it in your environment before starting
```

## Key Features

### Code Understanding & Generation

- Query and edit large codebases
- Generate new apps and code with powerful open-source models
- Debug issues and troubleshoot with natural language

### Automation & Integration

- Automate operational tasks like querying pull requests or handling complex rebases
- Use MCP servers to connect new capabilities
- Run non-interactively in scripts for workflow automation

### Advanced Capabilities

- Conversation checkpointing to save and resume complex sessions
- Custom context files to tailor behavior for your projects
- Multiple model support (DeepSeek, GPT-OSS, Qwen, GLM-4.6, and more)

### Option 2: Gemini API Key

**Best for:** Developers who need specific model control or paid tier access

**Benefits:**

- **Free tier**: 100 requests/day with Gemini 2.5 Pro
- **Model selection**: Choose specific Gemini models
- **Usage-based billing**: Upgrade for higher limits when needed

```bash
# Get your key from https://aistudio.google.com/apikey
export GEMINI_API_KEY="YOUR_API_KEY"
gemini
```

### Option 3: Vertex AI

**Best for:** Enterprise teams and production workloads

**Benefits:**

- **Enterprise features**: Advanced security and compliance
- **Scalable**: Higher rate limits with billing account
- **Integration**: Works with existing Google Cloud infrastructure

```bash
# Get your key from Google Cloud Console
export GOOGLE_API_KEY="YOUR_API_KEY"
export GOOGLE_GENAI_USE_VERTEXAI=true
gemini
```

For Google Workspace accounts and other authentication methods, see the
[authentication guide](./docs/get-started/authentication.md).

