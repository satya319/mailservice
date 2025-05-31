const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('./config');

class DKIMGenerator {
    constructor() {
        this.domain = config.domain;
        this.selector = config.dns.dkim.selector;
        this.keyDir = path.join(__dirname, 'keys');
    }

    generateKeys() {
        console.log('🔐 Generating DKIM keys for', this.domain);
        
        // Create keys directory if it doesn't exist
        if (!fs.existsSync(this.keyDir)) {
            fs.mkdirSync(this.keyDir, { recursive: true });
        }

        // Generate RSA key pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        // Save private key
        const privateKeyPath = path.join(this.keyDir, `${this.selector}.private`);
        fs.writeFileSync(privateKeyPath, privateKey);
        console.log('✅ Private key saved to:', privateKeyPath);

        // Save public key
        const publicKeyPath = path.join(this.keyDir, `${this.selector}.public`);
        fs.writeFileSync(publicKeyPath, publicKey);
        console.log('✅ Public key saved to:', publicKeyPath);

        // Generate DNS record
        const dnsRecord = this.generateDNSRecord(publicKey);
        const dnsRecordPath = path.join(this.keyDir, `${this.selector}.dns.txt`);
        fs.writeFileSync(dnsRecordPath, dnsRecord);
        console.log('✅ DNS record saved to:', dnsRecordPath);

        console.log('\n📋 DKIM DNS Record to add:');
        console.log('=====================================');
        console.log('Type: TXT');
        console.log(`Name: ${this.selector}._domainkey`);
        console.log(`Value: ${dnsRecord}`);
        console.log('=====================================\n');

        return {
            privateKey,
            publicKey,
            dnsRecord,
            selector: this.selector,
            domain: this.domain
        };
    }

    generateDNSRecord(publicKey) {
        // Extract the public key content (remove headers and newlines)
        const publicKeyContent = publicKey
            .replace(/-----BEGIN PUBLIC KEY-----/, '')
            .replace(/-----END PUBLIC KEY-----/, '')
            .replace(/\n/g, '');

        // Create DKIM DNS record
        return `v=DKIM1; k=rsa; p=${publicKeyContent}`;
    }

    loadKeys() {
        const privateKeyPath = path.join(this.keyDir, `${this.selector}.private`);
        const publicKeyPath = path.join(this.keyDir, `${this.selector}.public`);

        if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
            console.log('⚠️  DKIM keys not found. Generating new keys...');
            return this.generateKeys();
        }

        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

        console.log('✅ DKIM keys loaded successfully');
        return {
            privateKey,
            publicKey,
            selector: this.selector,
            domain: this.domain
        };
    }

    getDKIMSignature(email) {
        const keys = this.loadKeys();
        
        // Create DKIM signature headers
        const headers = [
            'from',
            'to',
            'subject',
            'date'
        ];

        // Create canonicalized header string
        const headerString = headers.map(header => {
            const value = email[header] || '';
            return `${header}:${value}`;
        }).join('\r\n');

        // Create DKIM signature
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(headerString);
        const signature = sign.sign(keys.privateKey, 'base64');

        return {
            'DKIM-Signature': `v=1; a=rsa-sha256; c=relaxed/relaxed; d=${this.domain}; s=${this.selector}; h=${headers.join(':')}; b=${signature}`
        };
    }
}

// CLI usage
if (require.main === module) {
    const dkim = new DKIMGenerator();
    
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'generate':
            dkim.generateKeys();
            break;
        case 'load':
            dkim.loadKeys();
            break;
        case 'dns':
            const keys = dkim.loadKeys();
            const dnsRecord = dkim.generateDNSRecord(keys.publicKey);
            console.log('\n📋 Add this DNS record:');
            console.log('=====================================');
            console.log('Type: TXT');
            console.log(`Name: ${dkim.selector}._domainkey`);
            console.log(`Value: ${dnsRecord}`);
            console.log('=====================================\n');
            break;
        default:
            console.log('Usage: node generate-dkim.js [generate|load|dns]');
            console.log('  generate - Generate new DKIM keys');
            console.log('  load     - Load existing DKIM keys');
            console.log('  dns      - Show DNS record for existing keys');
    }
}

module.exports = DKIMGenerator;