# CustomMail Setup Guide for jamjhadi.shop

## Overview
Your CustomMail system is now configured to work with your domain `jamjhadi.shop` and email address `manager@jamjhadi.shop`.

## Quick Start (Local Testing)

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test email functionality:**
   ```bash
   npm test
   ```

3. **Access the web interface:**
   Open http://localhost:3001 in your browser

## Configuration Files

- `config.js` - Main configuration for your domain
- `setup-dns.md` - DNS configuration instructions
- `test-email.js` - Email testing utilities
- `deploy.js` - Production deployment generator

## Local Development

### Starting the Server
```bash
npm start
```

This will start:
- Web server on port 3001
- API server on port 3002
- SMTP server on ports 25 and 2525

### Testing Email Sending
```bash
npm run test-send
```

### Testing Email Receiving
```bash
npm run test-receive
```

## Production Deployment

### 1. Prepare Your Server
You'll need a server with:
- Ubuntu/Debian Linux
- Public IP address
- Root access

### 2. Generate Deployment Files
```bash
npm run deploy YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with your actual server's public IP address.

### 3. Configure DNS Records
Follow the instructions in `setup-dns.md` to configure your DNS records.

**Required DNS Records:**
- A record: `mail.jamjhadi.shop` → `YOUR_SERVER_IP`
- MX record: `jamjhadi.shop` → `mail.jamjhadi.shop` (priority 10)
- TXT record: SPF record for email authentication

### 4. Deploy to Server
1. Upload your project files to your server
2. Run the generated deployment script:
   ```bash
   chmod +x deployment/deploy.sh
   sudo ./deployment/deploy.sh
   ```

### 5. Obtain SSL Certificates (Recommended)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d mail.jamjhadi.shop
```

## Email Flow

### Sending Emails
1. Compose email in web interface
2. Email is processed by your local SMTP server
3. Sent directly from your server to recipient's mail server
4. Copy saved to "Sent" folder

### Receiving Emails
1. External email servers look up MX record for jamjhadi.shop
2. Find mail.jamjhadi.shop as mail server
3. Connect to your server on port 25
4. Email delivered to your SMTP server
5. Email saved to "Inbox" folder
6. Visible in web interface

## Security Considerations

### Firewall Configuration
```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 25/tcp    # SMTP
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Email Authentication
- SPF record prevents email spoofing
- DKIM signing (optional, can be added later)
- DMARC policy for additional protection

## Troubleshooting

### Check Server Status
```bash
sudo systemctl status custommail
sudo systemctl status nginx
```

### Check Logs
```bash
sudo journalctl -u custommail -f
sudo tail -f /var/log/nginx/error.log
```

### Test DNS Configuration
```bash
dig MX jamjhadi.shop
dig A mail.jamjhadi.shop
dig TXT jamjhadi.shop
```

### Test SMTP Connection
```bash
telnet mail.jamjhadi.shop 25
```

## Common Issues

### Port 25 Blocked
Many cloud providers block port 25. You may need to:
- Contact your provider to unblock port 25
- Use alternative ports (587, 2525) for testing
- Consider using a relay service

### DNS Propagation
DNS changes can take up to 48 hours to propagate globally. Use online DNS checkers to verify your records.

### SSL Certificate Issues
Make sure your domain points to your server before obtaining SSL certificates.

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify DNS configuration
3. Test with the provided testing scripts
4. Check firewall and port accessibility

## Next Steps

1. **Configure DNS records** (see setup-dns.md)
2. **Deploy to production server**
3. **Obtain SSL certificates**
4. **Test email sending and receiving**
5. **Set up monitoring and backups**

Your email server will be accessible at:
- Web interface: https://mail.jamjhadi.shop
- Email address: manager@jamjhadi.shop