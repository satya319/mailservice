const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./config');
const DKIMGenerator = require('./generate-dkim');

class ProductionSetup {
    constructor() {
        this.config = config;
        this.dkim = new DKIMGenerator();
    }

    async setup() {
        console.log('🚀 Setting up CustomMail for production...\n');
        
        // Step 1: Validate configuration
        this.validateConfig();
        
        // Step 2: Generate DKIM keys
        this.setupDKIM();
        
        // Step 3: Create systemd service (Linux)
        this.createSystemdService();
        
        // Step 4: Setup firewall rules
        this.showFirewallInstructions();
        
        // Step 5: Show DNS configuration
        this.showDNSConfiguration();
        
        // Step 6: Show next steps
        this.showNextSteps();
    }

    validateConfig() {
        console.log('📋 Validating configuration...');
        
        const requiredFields = [
            'domain',
            'emailAddress'
        ];
        
        const missing = requiredFields.filter(field => !this.config[field]);
        
        if (missing.length > 0) {
            console.error('❌ Missing required configuration:', missing.join(', '));
            process.exit(1);
        }
        
        if (this.config.dns.a.ip === 'YOUR_SERVER_IP') {
            console.warn('⚠️  Please update YOUR_SERVER_IP in config.js with your actual server IP');
        }
        
        console.log('✅ Configuration validated\n');
    }

    setupDKIM() {
        console.log('🔐 Setting up DKIM authentication...');
        
        try {
            const keys = this.dkim.generateKeys();
            console.log('✅ DKIM keys generated successfully\n');
            return keys;
        } catch (error) {
            console.error('❌ Error generating DKIM keys:', error.message);
            return null;
        }
    }

    createSystemdService() {
        console.log('🔧 Creating systemd service...');
        
        const serviceContent = `[Unit]
Description=CustomMail Server
After=network.target

[Service]
Type=simple
User=custommail
WorkingDirectory=${process.cwd()}
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${process.cwd()}

[Install]
WantedBy=multi-user.target`;

        const servicePath = '/tmp/custommail.service';
        fs.writeFileSync(servicePath, serviceContent);
        
        console.log('✅ Systemd service file created at:', servicePath);
        console.log('📝 To install the service, run as root:');
        console.log('   sudo cp /tmp/custommail.service /etc/systemd/system/');
        console.log('   sudo systemctl daemon-reload');
        console.log('   sudo systemctl enable custommail');
        console.log('   sudo systemctl start custommail\n');
    }

    showFirewallInstructions() {
        console.log('🔥 Firewall Configuration:');
        console.log('==========================');
        console.log('Open these ports on your server:');
        console.log('');
        console.log('# SMTP (receiving emails)');
        console.log('sudo ufw allow 25/tcp');
        console.log('');
        console.log('# SMTP Submission (sending emails)');
        console.log('sudo ufw allow 587/tcp');
        console.log('');
        console.log('# Web interface');
        console.log('sudo ufw allow 3001/tcp');
        console.log('');
        console.log('# API');
        console.log('sudo ufw allow 3002/tcp');
        console.log('');
        console.log('# Enable firewall');
        console.log('sudo ufw enable');
        console.log('');
    }

    showDNSConfiguration() {
        console.log('🌐 DNS Configuration Required:');
        console.log('==============================');
        console.log('Add these DNS records to your domain:');
        console.log('');
        
        // A Record
        console.log('1. A Record:');
        console.log(`   Type: A`);
        console.log(`   Name: mail`);
        console.log(`   Value: ${this.config.dns.a.ip}`);
        console.log(`   TTL: 3600`);
        console.log('');
        
        // MX Record
        console.log('2. MX Record:');
        console.log(`   Type: MX`);
        console.log(`   Name: @`);
        console.log(`   Value: ${this.config.dns.mx.target}`);
        console.log(`   Priority: ${this.config.dns.mx.priority}`);
        console.log(`   TTL: 3600`);
        console.log('');
        
        // SPF Record
        console.log('3. SPF Record:');
        console.log(`   Type: TXT`);
        console.log(`   Name: @`);
        console.log(`   Value: ${this.config.dns.spf}`);
        console.log(`   TTL: 3600`);
        console.log('');
        
        // DMARC Record
        console.log('4. DMARC Record:');
        console.log(`   Type: TXT`);
        console.log(`   Name: _dmarc`);
        console.log(`   Value: ${this.config.dns.dmarc}`);
        console.log(`   TTL: 3600`);
        console.log('');
        
        // DKIM Record
        const dkimFile = path.join(__dirname, 'keys', `${this.config.dns.dkim.selector}.dns.txt`);
        if (fs.existsSync(dkimFile)) {
            const dkimRecord = fs.readFileSync(dkimFile, 'utf8');
            console.log('5. DKIM Record:');
            console.log(`   Type: TXT`);
            console.log(`   Name: ${this.config.dns.dkim.selector}._domainkey`);
            console.log(`   Value: ${dkimRecord}`);
            console.log(`   TTL: 3600`);
            console.log('');
        }
    }

    showNextSteps() {
        console.log('📝 Next Steps:');
        console.log('==============');
        console.log('1. Update config.js with your server\'s public IP address');
        console.log('2. Configure DNS records as shown above');
        console.log('3. Set up firewall rules');
        console.log('4. Install and start the systemd service');
        console.log('5. Obtain SSL certificates (recommended):');
        console.log('   sudo certbot certonly --standalone -d mail.jamjhadi.shop');
        console.log('6. Test email sending and receiving');
        console.log('7. Configure reverse DNS (PTR record) with your hosting provider');
        console.log('');
        console.log('📧 Your email address: manager@jamjhadi.shop');
        console.log('🌐 Web interface: http://your-server-ip:3001');
        console.log('');
        console.log('📚 For detailed instructions, see: DNS_SETUP_GUIDE.md');
        console.log('');
        console.log('🎉 Setup complete! Your CustomMail server is ready for production.');
    }

    // Helper method to check if running as root
    isRoot() {
        return process.getuid && process.getuid() === 0;
    }

    // Helper method to create user
    createUser() {
        if (!this.isRoot()) {
            console.log('⚠️  Run as root to create custommail user automatically');
            return;
        }

        try {
            execSync('id custommail', { stdio: 'ignore' });
            console.log('✅ User custommail already exists');
        } catch {
            console.log('👤 Creating custommail user...');
            execSync('useradd -r -s /bin/false custommail');
            execSync(`chown -R custommail:custommail ${process.cwd()}`);
            console.log('✅ User custommail created');
        }
    }
}

// CLI usage
if (require.main === module) {
    const setup = new ProductionSetup();
    setup.setup().catch(console.error);
}

module.exports = ProductionSetup;