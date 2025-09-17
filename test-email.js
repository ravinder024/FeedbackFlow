const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Loading .env from:', path.resolve(__dirname, '.env'));
console.log('\nEnvironment Variables:');
console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST);
console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT);
console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER);
console.log('EMAIL_SERVER_PASSWORD:', process.env.EMAIL_SERVER_PASSWORD ? '***' + process.env.EMAIL_SERVER_PASSWORD.slice(-4) : undefined);
console.log('EMAIL_SERVER_SECURE:', process.env.EMAIL_SERVER_SECURE);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

// Create test configuration with hardcoded values for comparison
const config = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: '900e75002@smtp-brevo.com',
    pass: 'Avy3D0zQf2PU1wxL'
  },
  secure: false,
  debug: true
};

console.log('\nHardcoded Config:', {
  host: config.host,
  port: config.port,
  user: config.auth.user,
  secure: config.secure
});

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport(config);

async function testEmail() {
  try {
    // Verify connection configuration
    console.log('Verifying connection...');
    const verification = await transporter.verify();
    console.log('Connection verified:', verification);

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: '"FeedbackFlow" <900e75002@smtp-brevo.com>',
      to: "900e75002@smtp-brevo.com",
      subject: "Test Email from FeedbackFlow",
      text: "This is a test email to verify SMTP configuration",
      html: "<b>This is a test email to verify SMTP configuration</b>"
    });

    console.log('Test email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmail(); 