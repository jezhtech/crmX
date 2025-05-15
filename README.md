# CRMX Insight Hub

A comprehensive CRM solution developed by JezX, a brand of Jezh Technologies Private Limited.

![CRMX Insight Hub](public/logo.png)

## Overview

CRMX Insight Hub is a modern, feature-rich Customer Relationship Management system designed to help businesses manage their client relationships, documents, and sales pipeline efficiently. Built with React, TypeScript, and Firebase, it offers a responsive and intuitive interface for both administrators and regular users.

## Features

- **User Role Management**: Separate dashboards and permissions for administrators and regular users
- **Lead Management**: Track and manage potential clients through your sales pipeline
- **Document Management**: Upload, organize, and retrieve important client documents
- **Dashboard Analytics**: Visualize your business performance with intuitive charts and metrics
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: React Context API
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/crmx-insight-hub.git
cd crmx-insight-hub
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Set up environment variables
Create a `.env` file in the root directory with your Firebase configuration:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

## Production Deployment

The application is configured for seamless deployment on Vercel with the included `vercel.json` configuration file.

## Copyright and License

© 2025 Jezh Technologies Private Limited. All rights reserved.

This software was developed by JezX, a brand of Jezh Technologies Private Limited, and Shabin. Unauthorized copying, distribution, modification, public display, or public performance of this software is strictly prohibited.

For licensing inquiries, please contact Jezh Technologies Private Limited.

## Contact

**Jezh Technologies Private Limited**
- Website: [jezhtechnologies.com](https://jezhtechnologies.com)
- Email: info@jezhtechnologies.com
