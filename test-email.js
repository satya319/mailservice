const nodemailer = require('nodemailer');
const config = require('./config');

// Test email sending functionality
async function testEmailSending() {
    console.log('🧪 Testing email sending functionality...');
    
    // Create transporter
    const transporter = nodemailer.createTransporter({
        host: 'localhost',
        port: config.smtp.altPort,
        secure: false,
        auth: config.smtp.auth.required ? {
            user: config.emailAddress,
            pass: 'your-password'
        } : undefined,
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        // Test email
        const testEmail = {
            from: config.emailAddress,
            to: 'test@example.com',
            subject: 'Test Email from CustomMail',
            text: `This is a test email sent from your CustomMail server for ${config.domain}.\n\nIf you receive this, your email system is working correctly!`,
            html: `
                <h2>Test Email from CustomMail</h2>
                <p>This is a test email sent from your CustomMail server for <strong>${config.domain}</strong>.</p>
                <p>If you receive this, your email system is working correctly!</p>
                <hr>
                <p><small>Sent from: ${config.emailAddress}</small></p>
            `
        };

        const info = await transporter.sendMail(testEmail);
        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📮 From:', config.emailAddress);
        console.log('📬 To:', testEmail.to);
        
    } catch (error) {
        console.error('❌ Error sending test email:', error.message);
    }
}

// Test email receiving by sending to local server
async function testEmailReceiving() {
    console.log('🧪 Testing email receiving functionality...');
    
    const transporter = nodemailer.createTransporter({
        host: 'localhost',
        port: config.smtp.altPort,
        secure: false,
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        const testEmail = {
            from: 'external@example.com',
            to: config.emailAddress,
            subject: 'Incoming Test Email',
            text: `This is a test email sent TO your CustomMail server.\n\nIf this appears in your inbox, email receiving is working!`,
            html: `
                <h2>Incoming Test Email</h2>
                <p>This is a test email sent <strong>TO</strong> your CustomMail server.</p>
                <p>If this appears in your inbox, email receiving is working!</p>
                <hr>
                <p><small>Test sent to: ${config.emailAddress}</small></p>
            `
        };

        const info = await transporter.sendMail(testEmail);
        console.log('✅ Test email sent to local server!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📮 From:', testEmail.from);
        console.log('📬 To:', config.emailAddress);
        console.log('💡 Check your inbox at http://localhost:3001');
        
    } catch (error) {
        console.error('❌ Error sending test email to local server:', error.message);
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting CustomMail Tests');
    console.log('================================');
    console.log(`📧 Domain: ${config.domain}`);
    console.log(`📮 Email: ${config.emailAddress}`);
    console.log('');
    
    await testEmailSending();
    console.log('');
    await testEmailReceiving();
    
    console.log('');
    console.log('================================');
    console.log('🏁 Tests completed!');
    console.log('💡 Open http://localhost:3001 to check your email interface');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testEmailSending, testEmailReceiving, runTests };