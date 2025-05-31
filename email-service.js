const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const config = require('./config');

class EmailService {
    constructor() {
        // Create SMTP transporter for external email delivery
        this.transporter = this.createTransporter();
        
        // Create local transporter for internal emails
        this.localTransporter = nodemailer.createTransport({
            host: 'localhost',
            port: config.smtp.altPort,
            secure: config.smtp.secure,
            auth: config.smtp.auth.required ? {
                user: config.emailAddress,
                pass: 'your-password'
            } : undefined,
            tls: {
                rejectUnauthorized: false
            }
        });

        this.dataDir = path.join(__dirname, 'data', 'emails');
        this.domain = config.domain;
        this.emailAddress = config.emailAddress;
        this.ensureDataDirectory();
    }

    createTransporter() {
        // For external email delivery, we'll use direct SMTP or relay
        if (config.outbound.relay.enabled) {
            // Use external relay service (like SendGrid, Mailgun, etc.)
            return nodemailer.createTransporter({
                host: config.outbound.relay.host,
                port: config.outbound.relay.port,
                secure: config.outbound.relay.port === 465,
                auth: {
                    user: config.outbound.relay.auth.user,
                    pass: config.outbound.relay.auth.pass
                }
            });
        } else {
            // Use direct SMTP delivery
            return nodemailer.createTransporter({
                direct: true, // Direct delivery to recipient's MX server
                name: config.domain, // HELO/EHLO name
                from: config.emailAddress
            });
        }
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        // Initialize email folders if they don't exist
        const folders = ['inbox', 'sent', 'drafts', 'trash'];
        folders.forEach(folder => {
            const filePath = path.join(this.dataDir, `${folder}.json`);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify([], null, 2));
            }
        });
    }

    async sendEmail(emailData) {
        try {
            const { to, cc, subject, body, attachments = [] } = emailData;
            
            // Determine if this is an internal or external email
            const recipients = [to, ...(cc ? cc.split(',') : [])];
            const isInternalEmail = recipients.every(email => 
                email.trim().toLowerCase().endsWith(`@${this.domain}`)
            );
            
            // Prepare email options
            const mailOptions = {
                from: this.emailAddress,
                to: to,
                cc: cc || undefined,
                subject: subject,
                text: body,
                html: body.replace(/\n/g, '<br>'),
                attachments: attachments.map(att => ({
                    filename: att.name,
                    content: Buffer.from(att.content, 'base64'),
                    contentType: att.type
                }))
            };

            // Choose appropriate transporter
            const transporter = isInternalEmail ? this.localTransporter : this.transporter;
            
            console.log(`📤 Sending ${isInternalEmail ? 'internal' : 'external'} email to: ${to}`);
            
            // Send email
            const info = await transporter.sendMail(mailOptions);
            
            // Save to sent folder
            const sentEmail = {
                id: Date.now(),
                from: this.emailAddress,
                to: to,
                cc: cc || '',
                subject: subject,
                body: body,
                date: new Date(),
                read: true,
                starred: false,
                attachments: attachments,
                messageId: info.messageId
            };

            this.saveEmailToFolder('sent', sentEmail);
            
            console.log('✅ Email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
            
        } catch (error) {
            console.error('❌ Error sending email:', error);
            return { success: false, error: error.message };
        }
    }

    saveEmailToFolder(folder, email) {
        const filePath = path.join(this.dataDir, `${folder}.json`);
        let emails = [];
        
        if (fs.existsSync(filePath)) {
            emails = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        emails.unshift(email);
        fs.writeFileSync(filePath, JSON.stringify(emails, null, 2));
    }

    getEmailsFromFolder(folder) {
        const filePath = path.join(this.dataDir, `${folder}.json`);
        
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        return [];
    }

    updateEmail(emailId, updates) {
        const folders = ['inbox', 'sent', 'drafts', 'trash'];
        
        for (const folder of folders) {
            const emails = this.getEmailsFromFolder(folder);
            const emailIndex = emails.findIndex(e => e.id === emailId);
            
            if (emailIndex !== -1) {
                emails[emailIndex] = { ...emails[emailIndex], ...updates };
                const filePath = path.join(this.dataDir, `${folder}.json`);
                fs.writeFileSync(filePath, JSON.stringify(emails, null, 2));
                return emails[emailIndex];
            }
        }
        
        return null;
    }

    deleteEmail(emailId, fromFolder) {
        const emails = this.getEmailsFromFolder(fromFolder);
        const emailIndex = emails.findIndex(e => e.id === emailId);
        
        if (emailIndex !== -1) {
            const email = emails.splice(emailIndex, 1)[0];
            
            // Save updated folder
            const filePath = path.join(this.dataDir, `${fromFolder}.json`);
            fs.writeFileSync(filePath, JSON.stringify(emails, null, 2));
            
            // Move to trash (unless already in trash)
            if (fromFolder !== 'trash') {
                this.saveEmailToFolder('trash', email);
            }
            
            return true;
        }
        
        return false;
    }

    saveDraft(draftData) {
        const draft = {
            id: Date.now(),
            from: this.emailAddress,
            to: draftData.to || '',
            cc: draftData.cc || '',
            subject: draftData.subject || '(No subject)',
            body: draftData.body || '',
            date: new Date(),
            read: true,
            starred: false,
            attachments: draftData.attachments || []
        };

        this.saveEmailToFolder('drafts', draft);
        return draft;
    }

    searchEmails(query) {
        const folders = ['inbox', 'sent', 'drafts'];
        let results = [];
        
        folders.forEach(folder => {
            const emails = this.getEmailsFromFolder(folder);
            const matches = emails.filter(email => 
                email.subject.toLowerCase().includes(query.toLowerCase()) ||
                email.body.toLowerCase().includes(query.toLowerCase()) ||
                email.from.toLowerCase().includes(query.toLowerCase()) ||
                email.to.toLowerCase().includes(query.toLowerCase())
            );
            results = results.concat(matches);
        });
        
        return results;
    }
}

module.exports = EmailService;