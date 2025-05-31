# DNS Configuration for jamjhadi.shop Email Server

## Required DNS Records

To make your email server work with your domain `jamjhadi.shop`, you need to add the following DNS records:

### 1. A Record for Mail Server
```
Type: A
Name: mail
Value: YOUR_SERVER_IP
TTL: 3600
```

### 2. MX Record for Email Routing
```
Type: MX
Name: @
Value: mail.jamjhadi.shop
Priority: 10
TTL: 3600
```

### 3. SPF Record for Email Authentication
```
Type: TXT
Name: @
Value: v=spf1 mx a ip4:YOUR_SERVER_IP ~all
TTL: 3600
```

### 4. DMARC Record (Optional but Recommended)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:manager@jamjhadi.shop
TTL: 3600
```

## Steps to Configure DNS

### If using Cloudflare:
1. Log into your Cloudflare dashboard
2. Select your domain `jamjhadi.shop`
3. Go to DNS > Records
4. Add each record above, replacing `YOUR_SERVER_IP` with your actual server IP

### If using other DNS providers:
1. Log into your domain registrar's control panel
2. Find the DNS management section
3. Add the records above

## Important Notes:

1. **Replace YOUR_SERVER_IP**: You need to replace `YOUR_SERVER_IP` with your actual server's public IP address
2. **TTL**: Time To Live - 3600 seconds (1 hour) is recommended
3. **MX Priority**: Lower numbers have higher priority (10 is standard)
4. **SPF Record**: This tells other email servers that your server is authorized to send emails for your domain

## Testing Your Configuration:

After adding DNS records, you can test them using:

```bash
# Test MX record
dig MX jamjhadi.shop

# Test A record
dig A mail.jamjhadi.shop

# Test SPF record
dig TXT jamjhadi.shop
```

## Server IP Configuration:

You'll also need to update the config.js file with your server's IP address:

```javascript
dns: {
  a: {
    subdomain: 'mail',
    ip: 'YOUR_ACTUAL_SERVER_IP' // Replace with your server IP
  },
  spf: 'v=spf1 mx a ip4:YOUR_ACTUAL_SERVER_IP ~all'
}
```

## Port Configuration:

Make sure your server allows incoming connections on:
- Port 25 (SMTP)
- Port 3001 (Web interface)
- Port 3002 (API)

If you're behind a firewall, you may need to configure port forwarding.