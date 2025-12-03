const { transporter } = require('../config/nodemailer.js');
const { getAdminNotificationTemplate, getUserConfirmationTemplate } = require('../template/email.template.js');

const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    const formData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : 'General Inquiry',
      message: message.trim(),
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    };

    // Get email templates
    const adminTemplate = getAdminNotificationTemplate(formData);
    const userTemplate = getUserConfirmationTemplate(formData);

    // Configure email options
    const adminMailOptions = {
      from: `"Devashya Naturals Website" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || 'admin@devashyanaturals.com',
      replyTo: formData.email,
      subject: adminTemplate.subject,
      html: adminTemplate.html
    };

    const userMailOptions = {
      from: `"Devashya Naturals" <${process.env.SMTP_USER}>`,
      to: formData.email,
      subject: userTemplate.subject,
      html: userTemplate.html
    };

    const [adminResult, userResult] = await Promise.allSettled([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    // Check if emails were sent successfully
    const adminSent = adminResult.status === 'fulfilled';
    const userSent = userResult.status === 'fulfilled';

    const referenceId = `CONTACT-${Date.now()}`;
    
    if (adminSent && userSent) {
      console.log(`✅ Contact form submitted by ${formData.name} (${formData.email}) - Both emails sent`);
      
      return res.status(200).json({
        success: true,
        message: 'Contact form submitted successfully. Check your email for confirmation.',
        data: {
          referenceId,
          submittedAt: formData.timestamp,
          emails: {
            admin: 'sent',
            user: 'sent'
          }
        }
      });
      
    } else if (adminSent) {
      console.log(`⚠️ Contact form submitted - Admin email sent but user confirmation failed`);
      
      return res.status(200).json({
        success: true,
        message: 'Contact form submitted. Our team will contact you soon.',
        warning: 'Confirmation email could not be sent.',
        data: {
          referenceId,
          submittedAt: formData.timestamp,
          emails: {
            admin: 'sent',
            user: 'failed'
          }
        }
      });
      
    } else {
      console.error('❌ Email sending failed:', adminResult.reason || userResult.reason);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send emails. Please try contacting us directly.',
        debug: process.env.NODE_ENV === 'development' ? {
          adminError: adminResult.reason?.message,
          userError: userResult.reason?.message
        } : undefined
      });
    }

  } catch (error) {
    console.error('❌ Contact form error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
};

// Optional: Health check endpoint
const checkEmailService = async (req, res) => {
  try {
    await transporter.verify();
    res.status(200).json({
      success: true,
      message: 'Email service is operational',
      service: 'Gmail SMTP',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Email service is unavailable',
      details: error.message
    });
  }
};

module.exports = {
  submitContactForm,
  checkEmailService
};