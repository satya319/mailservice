const http = require('http');
const fs = require('fs');
const path = require('path');
const APIServer = require('./api-server');
const EmailService = require('./email-service');
const config = require('./config');

const PORT = config.web.port;
const API_PORT = config.web.apiPort;

// Start API server
const apiServer = new APIServer(API_PORT);
apiServer.start();

// Start SMTP server
require('./smtp-server');

// Initialize with sample data
const emailService = new EmailService();
initializeSampleData(emailService);

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Parse URL
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

function initializeSampleData(emailService) {
  // Check if inbox already has data
  const inbox = emailService.getEmailsFromFolder('inbox');
  
  if (inbox.length === 0) {
    console.log('📝 Initializing sample email data...');
    
    // Sample emails
    const sampleEmails = [
      {
        id: 1,
        from: 'alice@example.com',
        to: config.emailAddress,
        subject: 'Welcome to CustomMail!',
        body: `Hi there,\n\nWelcome to your new self-hosted email service for ${config.domain}! This is a test email to show how the system works.\n\nYou can now:\n- Send and receive emails\n- Organize with folders\n- Search through your messages\n- Attach files\n\nBest regards,\nAlice`,
        date: new Date('2024-01-15T10:30:00'),
        read: false,
        starred: true,
        attachments: []
      },
      {
        id: 2,
        from: 'bob@company.com',
        to: config.emailAddress,
        subject: 'Project Update - Q1 2024',
        body: 'Hi there,\n\nHere\'s the latest update on our project. Everything is going according to plan and we\'re on track for the Q1 delivery.\n\nKey milestones completed:\n- Backend API development\n- Frontend UI implementation\n- Database schema design\n- Initial testing phase\n\nNext steps:\n- User acceptance testing\n- Performance optimization\n- Security audit\n\nThanks,\nBob',
        date: new Date('2024-01-14T14:20:00'),
        read: true,
        starred: false,
        attachments: []
      },
      {
        id: 3,
        from: 'newsletter@techblog.com',
        to: config.emailAddress,
        subject: 'Weekly Tech Newsletter - Serverless Trends',
        body: 'This week in tech:\n\n🚀 Serverless Computing Advances\n- New AWS Lambda features\n- Edge computing improvements\n- Cost optimization strategies\n\n💡 AI & Machine Learning\n- Latest ChatGPT updates\n- Open source AI models\n- ML deployment best practices\n\n🔧 Development Tools\n- New VS Code extensions\n- Docker improvements\n- CI/CD pipeline updates\n\nRead more at techblog.com',
        date: new Date('2024-01-13T09:00:00'),
        read: true,
        starred: false,
        attachments: []
      }
    ];

    // Save sample emails to inbox
    sampleEmails.forEach(email => {
      emailService.saveEmailToFolder('inbox', email);
    });

    // Sample sent email
    const sentEmail = {
      id: 4,
      from: config.emailAddress,
      to: 'alice@example.com',
      subject: 'Re: Welcome to CustomMail!',
      body: 'Hi Alice,\n\nThank you for the welcome! The system looks great and I\'m excited to start using it.\n\nThe interface is very intuitive and reminds me of Gmail, which is perfect.\n\nBest regards,\nManager',
      date: new Date('2024-01-15T11:00:00'),
      read: true,
      starred: false,
      attachments: []
    };

    emailService.saveEmailToFolder('sent', sentEmail);

    // Sample draft
    const draft = {
      id: 5,
      from: config.emailAddress,
      to: 'team@company.com',
      subject: 'Meeting Notes - Weekly Standup',
      body: 'Hi team,\n\nHere are the notes from today\'s meeting:\n\n## Agenda\n1. Project status updates\n2. Blockers and challenges\n3. Next week\'s priorities\n\n## Action Items\n- [ ] Complete API documentation\n- [ ] Review security requirements\n- [ ] Schedule user testing sessions\n\n[Draft - not sent yet]',
      date: new Date('2024-01-15T16:30:00'),
      read: true,
      starred: false,
      attachments: []
    };

    emailService.saveEmailToFolder('drafts', draft);
    
    console.log('✅ Sample data initialized successfully!');
  }
}

server.listen(PORT, () => {
  console.log('🎉 CustomMail Server Started!');
  console.log('================================');
  console.log(`🌐 Web Server: http://localhost:${PORT}/`);
  console.log(`🔌 API Server: http://localhost:${API_PORT}/`);
  console.log(`📬 SMTP Server: port ${config.smtp.port} (production) and ${config.smtp.altPort} (testing)`);
  console.log(`📧 Domain: ${config.domain}`);
  console.log(`📮 Email: ${config.emailAddress}`);
  console.log('');
  
  if (config.dns.a.ip === 'YOUR_SERVER_IP') {
    console.log('⚠️  SETUP REQUIRED:');
    console.log('   1. Update YOUR_SERVER_IP in config.js');
    console.log('   2. Configure DNS records (see DNS_SETUP_GUIDE.md)');
    console.log('   3. Run: npm run setup');
    console.log('');
  } else {
    console.log('✅ Server configured for production');
    console.log(`🌍 External access: http://${config.dns.a.ip}:${PORT}/`);
    console.log('');
  }
  
  console.log('📚 Documentation:');
  console.log('   - DNS Setup: DNS_SETUP_GUIDE.md');
  console.log('   - Generate DKIM: npm run generate-dkim');
  console.log('   - Production Setup: npm run setup');
  console.log('');
  console.log('Press Ctrl+C to stop all servers');
});