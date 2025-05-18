# HTTPS Setup Guide for crmX

This document outlines how to set up HTTPS for both development and production environments.

## Why HTTPS is Important

- **Security**: HTTPS encrypts all communication between the browser and server
- **Firebase Compatibility**: Firebase Storage requires HTTPS for uploads in most cases
- **Modern Features**: Many modern web APIs require HTTPS (geolocation, service workers, etc.)
- **CORS Compliance**: Avoids CORS issues when interacting with secure APIs

## Development Environment Setup

### Quick Setup (Automated)

1. Make the setup script executable:
   ```bash
   chmod +x setup-ssl.sh
   ```

2. Run the setup script:
   ```bash
   ./setup-ssl.sh
   ```

3. Restart your development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Manual Setup

1. **Install mkcert** (a tool to create locally-trusted development certificates)
   ```bash
   # macOS with Homebrew
   brew install mkcert
   brew install nss  # for Firefox support

   # Ubuntu/Debian
   sudo apt install libnss3-tools
   sudo apt install mkcert

   # Windows with Chocolatey
   choco install mkcert
   ```

2. **Create locally-trusted certificates**
   ```bash
   # Create a directory for certificates
   mkdir -p certs
   cd certs

   # Install the local CA in the system trust store
   mkcert -install

   # Create certificate for localhost and your IP
   mkcert localhost 127.0.0.1 ::1 192.168.0.181

   # Return to project root
   cd ..
   ```

3. **Configure your development server**

   For Vite (create or modify vite.config.ts):
   ```typescript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import fs from 'fs';
   import path from 'path';

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
   ```

   For Create React App (create .env file):
   ```
   HTTPS=true
   SSL_CRT_FILE=./certs/localhost+3.pem
   SSL_KEY_FILE=./certs/localhost+3-key.pem
   ```

## Production Environment Setup

For production environments, we recommend one of the following approaches:

### 1. Firebase Hosting with Custom Domain (Recommended)

1. **Add custom domain in Firebase console**
   - Go to Firebase Console > Your project > Hosting > Add custom domain
   - Follow the steps to verify domain ownership
   - Firebase will provide an SSL certificate automatically

2. **Deploy your app to Firebase Hosting**
   ```bash
   # Install Firebase CLI if not installed
   npm install -g firebase-tools

   # Login to Firebase
   firebase login

   # Initialize Firebase in your project (if not already done)
   firebase init

   # Build your production app
   npm run build

   # Deploy to Firebase
   firebase deploy
   ```

### 2. Using Cloudflare (Alternative)

1. **Sign up for a Cloudflare account**
2. **Add your website to Cloudflare**
   - Change your domain nameservers to Cloudflare's
   - Enable Cloudflare's SSL/TLS protection (recommend Full Strict mode)
3. **Configure your origin server**
   - Download Cloudflare's Origin Certificate
   - Install it on your web server

### 3. Let's Encrypt (DIY Approach)

If you're hosting on your own server:

1. **Install Certbot**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install certbot

   # CentOS
   sudo yum install certbot
   ```

2. **Generate certificate**
   ```bash
   sudo certbot --nginx  # for Nginx
   # OR
   sudo certbot --apache  # for Apache
   ```

3. **Set up auto-renewal**
   ```bash
   sudo certbot renew --dry-run
   # Add to crontab
   echo "0 0,12 * * * certbot renew --quiet" | sudo tee -a /etc/crontab
   ```

## Enforcing HTTPS in the Application

The codebase includes a utility function to enforce HTTPS:

```typescript
// src/lib/httpsRedirect.ts
export const enforceHttps = (): void => {
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'http:') {
    // Only redirect if not on localhost without a domain
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const newUrl = `https://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}${window.location.pathname}${window.location.search}`;
      window.location.href = newUrl;
    }
  }
};
```

This utility is already imported and used in `src/main.tsx`.

## Troubleshooting

### Certificate Issues

- **Browser doesn't trust the certificate**: Run `mkcert -install` again and restart your browser
- **Certificate expired**: Generate new certificates with mkcert

### CORS Issues

- **Firebase Storage CORS errors**: Make sure your Firebase Storage CORS configuration includes your HTTPS origins:

  ```bash
  # Edit cors-config.json to include your HTTPS origins
  cat > cors-config.json << EOL
  [
    {
      "origin": ["https://localhost:5173", "https://yourdomain.com"],
      "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
      "maxAgeSeconds": 3600,
      "responseHeader": [
        "Content-Type", 
        "Content-Length", 
        "Authorization", 
        "User-Agent", 
        "x-goog-resumable", 
        "Content-Disposition",
        "Accept",
        "Origin",
        "X-Requested-With"
      ]
    }
  ]
  EOL

  # Update Firebase Storage CORS configuration
  firebase storage:cors update cors-config.json
  ```

## Security Best Practices

1. **Set up HTTP Strict Transport Security (HSTS)**
   - For Nginx, add to server configuration:
     ```
     add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
     ```
   - For Apache, add to .htaccess:
     ```
     Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
     ```

2. **Configure Content Security Policy (CSP)**
   - Add CSP headers to restrict resources to HTTPS only
   - Example: `Content-Security-Policy: default-src https: 'unsafe-inline' 'unsafe-eval'`

3. **Stay Updated**
   - Regularly update your certificates before they expire
   - Keep your web server and SSL libraries up to date 