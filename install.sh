echo "=================================="
echo "Installing Ollama CLI"
echo "=================================="

npm install 
echo "=================================="
echo "Building Ollama CLI.."
echo "=================================="
npm run build
echo "=================================="
echo ""
echo "=================================="
echo "Linking Ollama CLI"
echo "Sudo required"
echo "=================================="
sudo npm link
echo "Ollama CLI has been installed!"
