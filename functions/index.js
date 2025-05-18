const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

// Configure nodemailer with SMTP details
// Note: This is just an example, you should use environment variables in production
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your preferred email service
  auth: {
    user: process.env.EMAIL_USER || 'your-company-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'  // Use app password for Gmail
  }
});

/**
 * Cloud Function to send email
 * Expects: { to, subject, html }
 */
exports.sendEmail = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to send emails'
    );
  }
  
  // Validate required fields
  if (!data.to || !data.subject || !data.html) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email must contain to, subject, and html fields'
    );
  }

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'CRM System <notifications@crm-system.com>',
    to: data.to,
    subject: data.subject,
    html: data.html
  };
  
  try {
    console.log(`Sending email to: ${data.to}, Subject: ${data.subject}`);
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error sending email',
      error
    );
  }
});

/**
 * HTTP endpoint for sending emails
 * This is an alternative way to send emails through HTTP requests
 */
exports.sendEmailHttp = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check request method
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    
    try {
      const { to, subject, html } = req.body;
      
      // Validate required fields
      if (!to || !subject || !html) {
        return res.status(400).send({ 
          error: 'Bad Request', 
          message: 'Email must contain to, subject, and html fields' 
        });
      }
      
      // Email options
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'CRM System <notifications@crm-system.com>',
        to,
        subject,
        html
      };
      
      // Send email
      await transporter.sendMail(mailOptions);
      return res.status(200).send({ success: true });
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).send({ 
        error: 'Internal Server Error', 
        message: error.message 
      });
    }
  });
}); 