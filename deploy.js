const fs = require('fs');
const path = require('path');
const config = require('./config');

// Production configuration generator
function generateProductionConfig(serverIP) {
    const prodConfig = {
        ...config,
        smtp: {
            ...config.smtp,
            port: 25,        // Standard SMTP port for production
            host: '0.0.0.0', // Listen on all interfaces
            secure: false,   // Set to true when you have SSL certificates
            auth: {
                required: true // Enable authentication in production
            }
        },
        security: {
            ...config.security,
            allowedDomains: [config.domain],
            maxEmailSize: 25 * 1024 * 1024,
            rateLimit: {
                maxEmails: 50,      // Stricter rate limiting
                windowMs: 3600000   // 1 hour
            }
        },
        dns: {
            ...config.dns,
            a: {
                subdomain: 'mail',
                ip: serverIP
            },
            spf: `v=spf1 mx a ip4:${serverIP} ~all`
        }
    };

    return prodConfig;
}

// Generate systemd service file
function generateSystemdService() {
    const serviceContent = `[Unit]
Description=CustomMail Email Server
After=network.target

[Service]
Type=simple
User=custommail
WorkingDirectory=/opt/custommail
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/custommail/data

[Install]
WantedBy=multi-user.target`;

    return serviceContent;
}

// Generate nginx configuration
function generateNginxConfig() {
    const nginxContent = `server {
    listen 80;
    server_name mail.${config.domain};
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mail.${config.domain};
    
    # SSL configuration (you'll need to obtain certificates)
    ssl_certificate /etc/ssl/certs/mail.${config.domain}.crt;
    ssl_certificate_key /etc/ssl/private/mail.${config.domain}.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:${config.web.port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:${config.web.apiPort}/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

    return nginxContent;
}

// Generate deployment script
function generateDeploymentScript(serverIP) {
    const deployScript = `#!/bin/bash

# CustomMail Deployment Script for ${config.domain}
echo "🚀 Deploying CustomMail for ${config.domain}..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx
sudo apt install -y nginx

# Create custommail user
sudo useradd -r -s /bin/false custommail

# Create application directory
sudo mkdir -p /opt/custommail
sudo chown custommail:custommail /opt/custommail

# Copy application files (you'll need to upload them first)
# sudo cp -r /path/to/your/custommail/* /opt/custommail/
# sudo chown -R custommail:custommail /opt/custommail

# Install dependencies
cd /opt/custommail
sudo -u custommail npm install --production

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 25/tcp    # SMTP
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# Create systemd service
sudo tee /etc/systemd/system/custommail.service > /dev/null << 'EOF'
$(generateSystemdService())
EOF

# Create nginx configuration
sudo tee /etc/nginx/sites-available/custommail > /dev/null << 'EOF'
$(generateNginxConfig())
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/custommail /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start services
sudo systemctl daemon-reload
sudo systemctl enable custommail
sudo systemctl start custommail
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "✅ Deployment completed!"
echo "📧 Your email server should now be running at https://mail.${config.domain}"
echo ""
echo "Next steps:"
echo "1. Configure DNS records (see setup-dns.md)"
echo "2. Obtain SSL certificates (recommended: Let's Encrypt)"
echo "3. Test email functionality"
echo ""
echo "Service status:"
sudo systemctl status custommail --no-pager
sudo systemctl status nginx --no-pager`;

    return deployScript;
}

// Main deployment function
function createDeploymentFiles(serverIP) {
    if (!serverIP) {
        console.error('❌ Please provide your server IP address');
        console.log('Usage: node deploy.js YOUR_SERVER_IP');
        process.exit(1);
    }

    console.log('🔧 Generating deployment files...');

    // Create deployment directory
    const deployDir = path.join(__dirname, 'deployment');
    if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir);
    }

    // Generate production config
    const prodConfig = generateProductionConfig(serverIP);
    fs.writeFileSync(
        path.join(deployDir, 'config.production.js'),
        `module.exports = ${JSON.stringify(prodConfig, null, 2)};`
    );

    // Generate systemd service
    fs.writeFileSync(
        path.join(deployDir, 'custommail.service'),
        generateSystemdService()
    );

    // Generate nginx config
    fs.writeFileSync(
        path.join(deployDir, 'nginx.conf'),
        generateNginxConfig()
    );

    // Generate deployment script
    fs.writeFileSync(
        path.join(deployDir, 'deploy.sh'),
        generateDeploymentScript(serverIP)
    );

    // Make deployment script executable
    fs.chmodSync(path.join(deployDir, 'deploy.sh'), '755');

    console.log('✅ Deployment files generated in ./deployment/ directory');
    console.log('');
    console.log('Files created:');
    console.log('- config.production.js (production configuration)');
    console.log('- custommail.service (systemd service file)');
    console.log('- nginx.conf (nginx configuration)');
    console.log('- deploy.sh (deployment script)');
    console.log('');
    console.log('Next steps:');
    console.log('1. Upload your project files to your server');
    console.log('2. Run the deployment script on your server');
    console.log('3. Configure DNS records (see setup-dns.md)');
    console.log('4. Obtain SSL certificates');
}

// Run if called directly
if (require.main === module) {
    const serverIP = process.argv[2];
    createDeploymentFiles(serverIP);
}

module.exports = { generateProductionConfig, createDeploymentFiles };