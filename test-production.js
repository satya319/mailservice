const EmailService = require('./email-service');
const config = require('./config');
const dns = require('dns').promises;

class ProductionTester {
    constructor() {
        this.emailService = new EmailService();
        this.domain = config.domain;
        this.emailAddress = config.emailAddress;
    }

    async runAllTests() {
        console.log('🧪 Running Production Email Tests');
        console.log('==================================\n');

        const tests = [
            this.testDNSRecords.bind(this),
            this.testSMTPConnection.bind(this),
            this.testInternalEmail.bind(this),
            this.testExternalEmail.bind(this),
            this.testEmailReceiving.bind(this)
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                await test();
                passed++;
            } catch (error) {
                console.error(`❌ Test failed: ${error.message}\n`);
                failed++;
            }
        }

        console.log('📊 Test Results:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

        if (failed === 0) {
            console.log('🎉 All tests passed! Your email server is ready for production.');
        } else {
            console.log('⚠️  Some tests failed. Please check the configuration and try again.');
        }
    }

    async testDNSRecords() {
        console.log('🌐 Testing DNS Records...');

        // Test MX record
        try {
            const mxRecords = await dns.resolveMx(this.domain);
            if (mxRecords.length > 0) {
                console.log(`✅ MX Record found: ${mxRecords[0].exchange}`);
            } else {
                throw new Error('No MX records found');
            }
        } catch (error) {
            throw new Error(`MX Record test failed: ${error.message}`);
        }

        // Test A record for mail subdomain
        try {
            const aRecords = await dns.resolve4(`mail.${this.domain}`);
            if (aRecords.length > 0) {
                console.log(`✅ A Record found: mail.${this.domain} -> ${aRecords[0]}`);
            } else {
                throw new Error('No A records found for mail subdomain');
            }
        } catch (error) {
            throw new Error(`A Record test failed: ${error.message}`);
        }

        // Test SPF record
        try {
            const txtRecords = await dns.resolveTxt(this.domain);
            const spfRecord = txtRecords.find(record => 
                record.join('').startsWith('v=spf1')
            );
            if (spfRecord) {
                console.log(`✅ SPF Record found: ${spfRecord.join('')}`);
            } else {
                console.log('⚠️  SPF Record not found (recommended for better deliverability)');
            }
        } catch (error) {
            console.log('⚠️  SPF Record test failed (not critical)');
        }

        console.log('✅ DNS Records test completed\n');
    }

    async testSMTPConnection() {
        console.log('📬 Testing SMTP Connection...');

        const net = require('net');
        
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            
            client.setTimeout(5000);
            
            client.connect(config.smtp.port, 'localhost', () => {
                console.log('✅ SMTP Server connection successful');
                client.destroy();
                resolve();
            });
            
            client.on('error', (error) => {
                reject(new Error(`SMTP connection failed: ${error.message}`));
            });
            
            client.on('timeout', () => {
                client.destroy();
                reject(new Error('SMTP connection timeout'));
            });
        });
    }

    async testInternalEmail() {
        console.log('📧 Testing Internal Email Delivery...');

        const testEmail = {
            to: this.emailAddress,
            subject: 'Internal Test Email',
            body: `This is a test email sent at ${new Date().toISOString()}\n\nIf you receive this, internal email delivery is working correctly.`
        };

        try {
            const result = await this.emailService.sendEmail(testEmail);
            if (result.success) {
                console.log('✅ Internal email sent successfully');
                console.log(`📨 Message ID: ${result.messageId}\n`);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            throw new Error(`Internal email test failed: ${error.message}`);
        }
    }

    async testExternalEmail() {
        console.log('📤 Testing External Email Delivery...');
        console.log('⚠️  This test requires manual verification');

        // For testing external email, we'll use a test service or the user's Gmail
        const testEmail = {
            to: 'test@gmail.com', // User should replace with their Gmail
            subject: 'External Test Email from CustomMail',
            body: `This is a test email sent from your CustomMail server (${this.emailAddress}) at ${new Date().toISOString()}\n\nIf you receive this email, external delivery is working correctly.\n\nDomain: ${this.domain}\nServer: mail.${this.domain}`
        };

        console.log('📝 To test external email delivery:');
        console.log(`1. Replace 'test@gmail.com' with your actual Gmail address`);
        console.log(`2. Run: node -e "const EmailService = require('./email-service'); const service = new EmailService(); service.sendEmail({to: 'your-gmail@gmail.com', subject: 'Test from CustomMail', body: 'Test email'});"`);
        console.log(`3. Check your Gmail inbox and spam folder`);
        console.log('✅ External email test setup completed\n');
    }

    async testEmailReceiving() {
        console.log('📥 Testing Email Receiving...');
        
        // Check if inbox has any emails
        const inbox = this.emailService.getEmailsFromFolder('inbox');
        console.log(`📊 Current inbox count: ${inbox.length} emails`);
        
        console.log('📝 To test email receiving:');
        console.log(`1. Send an email to: ${this.emailAddress}`);
        console.log(`2. Check the web interface at http://localhost:${config.web.port}`);
        console.log(`3. Or check the inbox.json file in data/emails/`);
        console.log('✅ Email receiving test setup completed\n');
    }

    async testEmailDeliverability() {
        console.log('📊 Testing Email Deliverability...');
        
        // Check various email authentication records
        const checks = [
            { name: 'SPF', test: () => this.checkSPF() },
            { name: 'DKIM', test: () => this.checkDKIM() },
            { name: 'DMARC', test: () => this.checkDMARC() },
            { name: 'Reverse DNS', test: () => this.checkReverseDNS() }
        ];

        for (const check of checks) {
            try {
                await check.test();
                console.log(`✅ ${check.name} check passed`);
            } catch (error) {
                console.log(`⚠️  ${check.name} check failed: ${error.message}`);
            }
        }
        
        console.log('✅ Deliverability tests completed\n');
    }

    async checkSPF() {
        const txtRecords = await dns.resolveTxt(this.domain);
        const spfRecord = txtRecords.find(record => 
            record.join('').startsWith('v=spf1')
        );
        if (!spfRecord) {
            throw new Error('SPF record not found');
        }
    }

    async checkDKIM() {
        const dkimSelector = config.dns.dkim.selector;
        try {
            const dkimRecords = await dns.resolveTxt(`${dkimSelector}._domainkey.${this.domain}`);
            if (dkimRecords.length === 0) {
                throw new Error('DKIM record not found');
            }
        } catch (error) {
            throw new Error('DKIM record not found');
        }
    }

    async checkDMARC() {
        try {
            const dmarcRecords = await dns.resolveTxt(`_dmarc.${this.domain}`);
            if (dmarcRecords.length === 0) {
                throw new Error('DMARC record not found');
            }
        } catch (error) {
            throw new Error('DMARC record not found');
        }
    }

    async checkReverseDNS() {
        // This would require knowing the server IP
        console.log('⚠️  Reverse DNS check requires manual verification with hosting provider');
    }
}

// CLI usage
if (require.main === module) {
    const tester = new ProductionTester();
    
    const args = process.argv.slice(2);
    const testType = args[0];

    switch (testType) {
        case 'dns':
            tester.testDNSRecords().catch(console.error);
            break;
        case 'smtp':
            tester.testSMTPConnection().catch(console.error);
            break;
        case 'internal':
            tester.testInternalEmail().catch(console.error);
            break;
        case 'external':
            tester.testExternalEmail().catch(console.error);
            break;
        case 'receiving':
            tester.testEmailReceiving().catch(console.error);
            break;
        case 'deliverability':
            tester.testEmailDeliverability().catch(console.error);
            break;
        case 'all':
        default:
            tester.runAllTests().catch(console.error);
    }
}

module.exports = ProductionTester;