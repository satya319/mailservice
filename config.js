module.exports = {
  // Domain Configuration
  domain: 'jamjhadi.shop',
  emailAddress: 'manager@jamjhadi.shop',
  
  // Server Configuration
  smtp: {
    port: 25,        // Standard SMTP port for receiving emails
    altPort: 2525,   // Alternative port for testing
    submissionPort: 587, // Port for sending emails (SMTP submission)
    host: '0.0.0.0', // Listen on all interfaces
    secure: false,   // Set to true when you have SSL certificates
    auth: {
      required: false // Set to true for production
    }
  },
  
  // Web Server Configuration
  web: {
    port: 3001,
    apiPort: 3002
  },
  
  // Email Storage
  storage: {
    dataDir: './data/emails'
  },
  
  // Security Settings
  security: {
    allowedDomains: ['jamjhadi.shop'], // Only accept emails for your domain
    maxEmailSize: 25 * 1024 * 1024,   // 25MB max email size
    rateLimit: {
      maxEmails: 100,     // Max emails per hour
      windowMs: 3600000   // 1 hour in milliseconds
    }
  },
  
  // External SMTP for sending emails (to reach Gmail, etc.)
  outbound: {
    // For sending emails to external domains like Gmail
    smtp: {
      host: 'localhost',
      port: 587,
      secure: false,
      auth: {
        user: 'manager@jamjhadi.shop',
        pass: 'your-smtp-password' // Set this when you configure authentication
      }
    },
    // Fallback to direct SMTP for better deliverability
    directSMTP: true,
    // Backup relay (optional - you can use a service like SendGrid, Mailgun, etc.)
    relay: {
      enabled: false,
      host: '',
      port: 587,
      auth: {
        user: '',
        pass: ''
      }
    }
  },
  
  // DNS Configuration (for reference)
  dns: {
    mx: {
      priority: 10,
      target: 'mail.jamjhadi.shop'
    },
    a: {
      subdomain: 'mail',
      ip: 'YOUR_SERVER_IP' // Replace with your actual server IP
    },
    spf: 'v=spf1 mx a ip4:YOUR_SERVER_IP ~all',
    dkim: {
      selector: 'default',
      // DKIM keys will be generated
    },
    dmarc: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@jamjhadi.shop'
  }
};