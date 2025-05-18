# Email Notification Setup Guide for crmX

This document outlines the implementation of email notifications in the crmX system, specifically for the feature that sends email notifications when a lead's status is changed to "Project".

## Implemented Features

- Automatic email notification to `shabin@jezhtechnologies.com` when a lead status changes to "Project"
- Styled HTML email template with comprehensive lead details
- Integration with Firebase Cloud Functions for reliable email delivery
- Error handling to ensure the main status update succeeds even if email delivery fails

## Technical Implementation

1. **Email Service**: Created `src/services/emailService.ts` to handle formatting and sending emails.
2. **Firebase Integration**: Updated Firebase configuration to include Functions.
3. **Status Change Detection**: Updated `UpdateStatusDialog.tsx` to trigger email notification when status changes to "Project".
4. **Cloud Functions**: Created Firebase Cloud Functions for server-side email delivery using Nodemailer.

## How to Deploy

### 1. Set up Firebase Functions

If not already done, initialize Firebase Functions in your project:

```bash
firebase init functions
```

### 2. Configure Environment Variables

Set up environment variables for the email service in your Firebase Functions:

```bash
firebase functions:config:set email.user="your-email@company.com" email.password="your-app-password" email.from="CRM System <notifications@your-company.com>"
```

For security, use app-specific passwords when using Gmail. [Learn how to create an app password for Gmail](https://support.google.com/accounts/answer/185833).

### 3. Deploy Functions

Deploy the Firebase Functions:

```bash
firebase deploy --only functions
```

## Testing Email Functionality

You can test the email functionality by:

1. Navigating to any lead in the system
2. Opening the status update dialog
3. Changing the status to "Project"
4. Completing the update

The system should update the lead status and send an email notification to `shabin@jezhtechnologies.com` with all the lead details.

## Troubleshooting

### Email Not Being Sent

1. Check Firebase Functions logs:
```bash
firebase functions:log
```

2. Verify SMTP credentials are correct in environment variables:
```bash
firebase functions:config:get
```

3. Check if the email provider blocks automated emails (common with Gmail)

### Authentication Errors

If using Gmail and seeing authentication errors:
- Ensure you're using an App Password and not your regular account password
- Verify that "Less secure app access" is enabled for the sending account
- Check if 2-Factor Authentication settings are affecting the connection

## Customizing Email Template

The email template is defined in `src/services/emailService.ts` in the `sendProjectStatusEmail` function. Modify the HTML template in this function to change the email appearance.

## Adding More Email Notifications

To add more email notifications for different events:

1. Create a new function in `emailService.ts` similar to `sendProjectStatusEmail`
2. Customize the email content and subject for your specific notification
3. Call this function from the appropriate component when the trigger event occurs 