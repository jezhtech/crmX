import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Lead } from "@/types/lead";

/**
 * Email service for sending various types of emails in the application
 */

// Interface for email data
interface EmailData {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using Firebase Cloud Functions
 * @param emailData The email data to send
 */
export const sendEmail = async (emailData: EmailData): Promise<void> => {
  try {
    // Call the Firebase function to send email
    // This assumes you have a cloud function named 'sendEmail' set up in Firebase
    const sendEmailFn = httpsCallable(functions, 'sendEmail');
    await sendEmailFn(emailData);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

/**
 * Send a project status notification email with lead details
 * @param lead The lead that was updated to project status
 * @param updatedBy The user who updated the status
 */
export const sendProjectStatusEmail = async (lead: Lead, updatedBy: string): Promise<void> => {
  try {
    // Format currency based on user's locale
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(lead.value || 0);

    // Format dates
    const createdDate = new Date(lead.createdAt).toLocaleDateString();
    const updatedDate = new Date(lead.updatedAt).toLocaleDateString();

    // Create email HTML content with lead details
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">New Project Update</h1>
        </div>
        
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333;">
            A lead has been updated to <strong>Project</strong> status.
          </p>
          
          <div style="background-color: #f9fafb; border: 1px solid #eaeaea; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h2 style="color: #4f46e5; margin-top: 0;">Lead Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; width: 40%; color: #666;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; font-weight: 600;">${lead.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Company:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; font-weight: 600;">${lead.company}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Contact Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;"><a href="mailto:${lead.email}" style="color: #4f46e5; text-decoration: none;">${lead.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Phone:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${lead.phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Project Value:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; font-weight: 600;">${formattedValue}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Address:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${lead.address || "N/A"}</td>
              </tr>
            </table>
            
            <h3 style="margin-top: 20px; color: #4f46e5;">Project Requirements</h3>
            <p style="margin: 0; font-weight: 600;">${lead.projectRequirementTitle || "No title provided"}</p>
            <p style="margin-top: 10px; white-space: pre-line;">${lead.projectRequirementDetails || "No details provided"}</p>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eaeaea;">
              <p style="margin: 0; color: #666;">Lead Created: ${createdDate}</p>
              <p style="margin: 5px 0 0; color: #666;">Last Updated: ${updatedDate}</p>
              <p style="margin: 5px 0 0; color: #666;">Status Changed by: ${updatedBy}</p>
            </div>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            You can access the full lead details in the CRM system.
          </p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
          <p style="margin: 0;">This is an automated message from the crmX system. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const emailData: EmailData = {
      to: "shabin@jezhtechnologies.com",
      subject: `New Project Status: ${lead.name} from ${lead.company}`,
      html
    };

    await sendEmail(emailData);
  } catch (error) {
    console.error("Error sending project status email:", error);
    throw new Error("Failed to send project status email");
  }
}; 