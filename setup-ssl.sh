#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up SSL for local development...${NC}"

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert is not installed. Installing it now..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "Homebrew is not installed. Please install it first:"
        echo "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    # Install mkcert using Homebrew
    brew install mkcert
    brew install nss # for Firefox support
fi

# Create certs directory
mkdir -p ./certs
cd ./certs

# Run mkcert
echo -e "${BLUE}Creating SSL certificates...${NC}"
mkcert -install
mkcert localhost 127.0.0.1 ::1 192.168.0.181

echo -e "${GREEN}Certificates created successfully!${NC}"
echo -e "Certificate file: $(pwd)/localhost+3.pem"
echo -e "Key file: $(pwd)/localhost+3-key.pem"

# Return to previous directory
cd ..

# Create vite.config.ts if it doesn't exist
if [ ! -f "vite.config.ts" ]; then
    echo -e "${BLUE}Creating Vite configuration file...${NC}"
    cat > vite.config.ts << EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost+3-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost+3.pem')),
    },
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
EOL
else
    echo -e "${BLUE}Updating Vite configuration with HTTPS settings...${NC}"
    # Backup the existing file
    cp vite.config.ts vite.config.ts.backup
    
    # Simple string replace may not work for all cases, but will attempt a basic modification
    # This is a simplified approach - may need manual editing for complex configs
    sed -i '' 's/server: {/server: {\
    https: {\
      key: fs.readFileSync(path.resolve(__dirname, "certs\/localhost+3-key.pem")),\
      cert: fs.readFileSync(path.resolve(__dirname, "certs\/localhost+3.pem")),\
    },/g' vite.config.ts
    
    # Add fs and path imports if they don't exist
    if ! grep -q "import fs from 'fs';" vite.config.ts; then
        sed -i '' '1s/^/import fs from "fs";\nimport path from "path";\n/' vite.config.ts
    fi
fi

# Create a .env file with HTTPS=true for Create React App (if it's a CRA project)
echo -e "${BLUE}Creating .env file for HTTPS...${NC}"
echo "HTTPS=true" > .env
echo "SSL_CRT_FILE=./certs/localhost+3.pem" >> .env
echo "SSL_KEY_FILE=./certs/localhost+3-key.pem" >> .env

echo -e "${GREEN}SSL setup complete!${NC}"
echo -e "You can now run your development server with HTTPS:"
echo -e "${BLUE}npm run dev${NC} or ${BLUE}yarn dev${NC}"
echo -e "Your site will be available at: https://localhost:5173"
echo -e "Also available at: https://192.168.0.181:5173"
echo -e "\nNOTE: You may need to restart your browser to trust the new certificates." 