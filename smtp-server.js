const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Create emails directory if it doesn't exist
const emailsDir = path.join(__dirname, 'data', 'emails');
if (!fs.existsSync(emailsDir)) {
    fs.mkdirSync(emailsDir, { recursive: true });
}

// SMTP Server for receiving emails
const server = new SMTPServer({
    // Allow all connections
    authOptional: !config.smtp.auth.required,
    secure: config.smtp.secure,
    
    // Validate recipients - only accept emails for your domain
    onRcptTo(address, session, callback) {
        const emailAddress = address.address.toLowerCase();
        const domain = emailAddress.split('@')[1];
        
        if (config.security.allowedDomains.includes(domain)) {
            callback();
        } else {
            callback(new Error(`Domain ${domain} not accepted`));
        }
    },
    
    // Handle incoming emails
    onData(stream, session, callback) {
        let emailData = '';
        
        stream.on('data', (chunk) => {
            emailData += chunk;
        });
        
        stream.on('end', async () => {
            try {
                // Parse the email
                const parsed = await simpleParser(emailData);
                
                // Create email object
                const email = {
                    id: Date.now(),
                    from: parsed.from?.text || session.envelope.mailFrom?.address,
                    to: parsed.to?.text || session.envelope.rcptTo.map(r => r.address).join(', '),
                    cc: parsed.cc?.text || '',
                    subject: parsed.subject || '(No subject)',
                    body: parsed.text || parsed.html || '',
                    date: new Date(),
                    read: false,
                    starred: false,
                    attachments: parsed.attachments ? parsed.attachments.map(att => ({
                        name: att.filename,
                        size: att.size,
                        type: att.contentType,
                        content: att.content.toString('base64')
                    })) : []
                };
                
                // Save to inbox
                const inboxFile = path.join(emailsDir, 'inbox.json');
                let inbox = [];
                
                if (fs.existsSync(inboxFile)) {
                    inbox = JSON.parse(fs.readFileSync(inboxFile, 'utf8'));
                }
                
                inbox.unshift(email);
                fs.writeFileSync(inboxFile, JSON.stringify(inbox, null, 2));
                
                console.log(`📧 New email received: ${email.subject} from ${email.from}`);
                callback();
                
            } catch (error) {
                console.error('Error processing email:', error);
                callback(error);
            }
        });
    },
    
    onAuth(auth, session, callback) {
        // Accept any authentication for demo
        callback(null, { user: auth.username });
    }
});

// Start SMTP server on both standard and alternative ports
server.listen(config.smtp.port, config.smtp.host, () => {
    console.log(`📬 SMTP Server listening on ${config.smtp.host}:${config.smtp.port}`);
    console.log(`📧 Ready to receive emails for ${config.domain}`);
});

// Also listen on alternative port for testing
const testServer = new SMTPServer({
    authOptional: true,
    onData: server.options.onData,
    onRcptTo: server.options.onRcptTo
});

testServer.listen(config.smtp.altPort, () => {
    console.log(`🧪 Test SMTP Server listening on port ${config.smtp.altPort}`);
});

server.on('error', (err) => {
    console.error('SMTP Server error:', err);
});

module.exports = server;