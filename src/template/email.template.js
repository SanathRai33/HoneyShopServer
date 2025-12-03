const getAdminNotificationTemplate = (data) => ({
  subject: `New Contact Form Submission - ${data.subject || 'General Inquiry'}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #fff9ed; padding: 30px; border: 1px solid #fcd34d; border-top: none; border-radius: 0 0 10px 10px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #92400e; }
        .value { color: #78350f; padding: 5px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #fcd34d; color: #92400e; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Form Submission</h2>
          <p>Devashya Naturals Website</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Name:</div>
            <div class="value">${data.name}</div>
          </div>
          <div class="field">
            <div class="label">Email:</div>
            <div class="value">${data.email}</div>
          </div>
          <div class="field">
            <div class="label">Phone:</div>
            <div class="value">${data.phone || 'Not provided'}</div>
          </div>
          <div class="field">
            <div class="label">Subject:</div>
            <div class="value">${data.subject || 'General Inquiry'}</div>
          </div>
          <div class="field">
            <div class="label">Message:</div>
            <div class="value" style="white-space: pre-wrap;">${data.message}</div>
          </div>
          <div class="field">
            <div class="label">Submitted At:</div>
            <div class="value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
          </div>
          <div class="field">
            <div class="label">IP Address:</div>
            <div class="value">${data.ip || 'Not available'}</div>
          </div>
          <div class="footer">
            <p>This email was sent from the contact form on Devashya Naturals website.</p>
            <p>Please respond within 24 hours.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
});

const getUserConfirmationTemplate = (data) => ({
  subject: `Thank You for Contacting Devashya Naturals`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #fff9ed; padding: 30px; border: 1px solid #fcd34d; border-top: none; border-radius: 0 0 10px 10px; }
        .greeting { font-size: 18px; color: #78350f; margin-bottom: 20px; }
        .message { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .contact-info { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #fcd34d; color: #92400e; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Devashya Naturals</h2>
          <p>Pure Honey & Natural Products</p>
        </div>
        <div class="content">
          <div class="greeting">
            <strong>Dear ${data.name},</strong>
          </div>
          
          <p>Thank you for contacting Devashya Naturals! We have received your message and our team will get back to you within <strong>24-48 hours</strong>.</p>
          
          <div class="message">
            <strong>Your Message:</strong>
            <p style="white-space: pre-wrap; margin-top: 10px;">${data.message}</p>
          </div>
          
          <div class="contact-info">
            <h3>For Urgent Inquiries:</h3>
            <p>📞 Phone: <strong>+91 98765 43210</strong></p>
            <p>📱 WhatsApp: <strong>+91 98765 43210</strong></p>
            <p>📧 Email: <strong>hello@devashya.com</strong></p>
          </div>
          
          <p><strong>Reference ID:</strong> CONTACT-${Date.now()}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          
          <div class="footer">
            <p>Warm regards,<br>The Devashya Naturals Team</p>
            <p>📍 Bengaluru, Karnataka | 🌐 www.devashyanaturals.com</p>
            <p style="font-size: 10px; color: #92400e; margin-top: 10px;">
              This is an automated response. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
});

module.exports = {
  getAdminNotificationTemplate,
  getUserConfirmationTemplate
};