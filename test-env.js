require('dotenv').config();

console.log('Environment Variables:');
console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST);
console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT);
console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER);
console.log('EMAIL_SERVER_PASSWORD:', process.env.EMAIL_SERVER_PASSWORD ? '***' + process.env.EMAIL_SERVER_PASSWORD.slice(-4) : undefined);
console.log('EMAIL_SERVER_SECURE:', process.env.EMAIL_SERVER_SECURE);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL); 