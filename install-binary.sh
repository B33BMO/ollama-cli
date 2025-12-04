#!/bin/bash
# Blackbox CLI Binary Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/B33BMO/ollama-cli/master/install-binary.sh | bash

set -e

REPO="B33BMO/ollama-cli"
INSTALL_DIR="${BLACKBOX_INSTALL_DIR:-$HOME/.local/bin}"
BINARY_NAME="blackbox"

# Detect OS and architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  darwin) OS="macos" ;;
  linux) OS="linux" ;;
  *)
    echo "Error: Unsupported operating system: $OS"
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)
    echo "Error: Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

PLATFORM="${OS}-${ARCH}"
BINARY_URL="https://github.com/${REPO}/releases/latest/download/blackbox-${PLATFORM}"

echo "Blackbox CLI Installer"
echo "======================"
echo "Platform: ${PLATFORM}"
echo "Install directory: ${INSTALL_DIR}"
echo ""

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Download the binary
echo "Downloading blackbox..."
if command -v curl &> /dev/null; then
  curl -fsSL "$BINARY_URL" -o "${INSTALL_DIR}/${BINARY_NAME}"
elif command -v wget &> /dev/null; then
  wget -q "$BINARY_URL" -O "${INSTALL_DIR}/${BINARY_NAME}"
else
  echo "Error: Neither curl nor wget found. Please install one of them."
  exit 1
fi

# Make it executable
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

echo ""
echo "Blackbox CLI installed successfully!"
echo ""

# Check if install dir is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo "Add the following to your shell profile (.bashrc, .zshrc, etc.):"
  echo ""
  echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
  echo ""
  echo "Then restart your shell or run:"
  echo ""
  echo "  source ~/.bashrc  # or ~/.zshrc"
  echo ""
fi

echo "Run 'blackbox' to get started!"
