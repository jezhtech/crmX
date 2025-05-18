# Firebase Storage CORS Configuration Guide

This guide will help you fix CORS (Cross-Origin Resource Sharing) issues when uploading files to Firebase Storage in the crmX application.

## What is the issue?

When uploading documents in the admin portal, you might see CORS errors like:

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://192.168.0.181:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

This happens because Firebase Storage is restricting requests from your origin (development server or production deployment).

## How to fix it

### Method 1: Using the HTTP-specific script (Recommended for HTTP origins)

If you're specifically having issues with uploading from an HTTP origin (not HTTPS), use this method:

1. Make sure you have Firebase CLI installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

3. Navigate to project directory and run the HTTP-specific update script:
   ```bash
   cd /path/to/crmx-insight-hub
   chmod +x update-cors-http.sh
   ./update-cors-http.sh
   ```

   This script automatically detects your IP address and adds it to the allowed HTTP origins.

### Method 2: Using the standard script

1. Make sure you have Firebase CLI installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

3. Navigate to project directory and run the update script:
   ```bash
   cd /path/to/crmx-insight-hub
   chmod +x update-cors.sh
   ./update-cors.sh
   ```

### Method 3: Manual configuration

1. Install Firebase CLI and log in as described above.

2. Run the CORS update command directly:
   ```bash
   firebase storage:cors update cors-config.json
   ```

3. Verify the configuration was updated:
   ```bash
   firebase storage:cors get
   ```

## Testing the fix

After updating the CORS configuration:

1. Clear browser cache or use incognito/private mode
2. Restart your development server
3. Try uploading a document again

## HTTP-specific Solutions

If you're using HTTP (not HTTPS) and still having issues after updating CORS:

1. The application now includes multiple fallback methods for uploading from HTTP origins
2. If automatic fallback doesn't work, it will store files in browser local storage temporarily
3. For a permanent solution, consider:
   - Setting up an HTTPS development environment using a tool like [mkcert](https://github.com/FiloSottile/mkcert)
   - Using Firebase Hosting for development (which provides HTTPS)
   - Configuring a reverse proxy with HTTPS

## CORS Configuration Details

The HTTP-specific CORS configuration in `cors-config-http.json` contains:

```json
[
  {
    "origin": [
      "*", 
      "http://<your-ip>:8080",
      "http://<your-ip>:3000",
      "http://<your-ip>:5173",
      "http://localhost:3000", 
      "http://localhost:5173",
      "http://localhost:8080",
      "http://192.168.0.181:8080"
    ],
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
      "X-Requested-With",
      "Access-Control-Allow-Origin",
      "ETag",
      "Cache-Control"
    ]
  }
]
```

## Production Security Considerations

For production, you should restrict the allowed origins to your specific domains:

```json
{
  "origin": ["https://yourdomain.com", "https://admin.yourdomain.com"],
  "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
  "maxAgeSeconds": 3600,
  "responseHeader": [...]
}
```

## Need more help?

If you're still experiencing CORS issues, try:

1. Check the browser console for specific error messages
2. Ensure your Firebase project is correctly configured in `src/lib/firebase.ts`
3. Try using the local storage fallback option, which works even when CORS fails
4. Contact the development team for further assistance 