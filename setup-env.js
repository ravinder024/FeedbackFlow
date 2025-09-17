const fs = require('fs');
const path = require('path');

const envContent = `# Brevo SMTP Configuration
EMAIL_SERVER_HOST=smtp-relay.brevo.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-brevo-account-email
EMAIL_SERVER_PASSWORD=your-brevo-smtp-key
EMAIL_SERVER_SECURE=false
EMAIL_FROM=FeedbackFlow <your-verified-sender-email>

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"`;

console.log('Starting environment setup...\n');

// Write to both .env and .env.local
['env', 'env.local'].forEach(file => {
  const filePath = path.join(__dirname, '.' + file);
  try {
    fs.writeFileSync(filePath, envContent);
    console.log(`✅ Created ${filePath} successfully`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
});

console.log('\n📝 Next steps:');
console.log('1. Open either .env or .env.local in your text editor');
console.log('2. Update the following values with your Brevo credentials:');
console.log('   - EMAIL_SERVER_USER (Your Brevo account email)');
console.log('   - EMAIL_SERVER_PASSWORD (Your Brevo SMTP key)');
console.log('   - EMAIL_FROM (Your verified sender email in Brevo)');
console.log('\n3. After updating the values, run:');
console.log('   node test-email.js'); 