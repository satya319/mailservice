const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const EmailService = require('./email-service');

class APIServer {
    constructor(port = 3002) {
        this.port = port;
        this.emailService = new EmailService();
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 API Server running on http://localhost:${this.port}`);
        });
    }

    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        const method = req.method;

        try {
            // Route handling
            if (path === '/api/emails' && method === 'GET') {
                await this.getEmails(req, res, parsedUrl.query);
            } else if (path === '/api/emails/send' && method === 'POST') {
                await this.sendEmail(req, res);
            } else if (path === '/api/emails/draft' && method === 'POST') {
                await this.saveDraft(req, res);
            } else if (path.startsWith('/api/emails/') && method === 'PUT') {
                await this.updateEmail(req, res, path);
            } else if (path.startsWith('/api/emails/') && method === 'DELETE') {
                await this.deleteEmail(req, res, path);
            } else if (path === '/api/emails/search' && method === 'GET') {
                await this.searchEmails(req, res, parsedUrl.query);
            } else if (path === '/api/health' && method === 'GET') {
                this.sendResponse(res, 200, { status: 'OK', timestamp: new Date().toISOString() });
            } else {
                this.sendResponse(res, 404, { error: 'Endpoint not found' });
            }
        } catch (error) {
            console.error('API Error:', error);
            this.sendResponse(res, 500, { error: 'Internal server error' });
        }
    }

    async getEmails(req, res, query) {
        const folder = query.folder || 'inbox';
        const emails = this.emailService.getEmailsFromFolder(folder);
        this.sendResponse(res, 200, { emails, folder });
    }

    async sendEmail(req, res) {
        const body = await this.getRequestBody(req);
        const emailData = JSON.parse(body);

        const result = await this.emailService.sendEmail(emailData);
        
        if (result.success) {
            this.sendResponse(res, 200, { message: 'Email sent successfully', messageId: result.messageId });
        } else {
            this.sendResponse(res, 400, { error: result.error });
        }
    }

    async saveDraft(req, res) {
        const body = await this.getRequestBody(req);
        const draftData = JSON.parse(body);

        const draft = this.emailService.saveDraft(draftData);
        this.sendResponse(res, 200, { message: 'Draft saved', draft });
    }

    async updateEmail(req, res, path) {
        const emailId = parseInt(path.split('/').pop());
        const body = await this.getRequestBody(req);
        const updates = JSON.parse(body);

        const updatedEmail = this.emailService.updateEmail(emailId, updates);
        
        if (updatedEmail) {
            this.sendResponse(res, 200, { message: 'Email updated', email: updatedEmail });
        } else {
            this.sendResponse(res, 404, { error: 'Email not found' });
        }
    }

    async deleteEmail(req, res, path) {
        const emailId = parseInt(path.split('/').pop());
        const body = await this.getRequestBody(req);
        const { folder } = JSON.parse(body || '{}');

        const deleted = this.emailService.deleteEmail(emailId, folder || 'inbox');
        
        if (deleted) {
            this.sendResponse(res, 200, { message: 'Email deleted' });
        } else {
            this.sendResponse(res, 404, { error: 'Email not found' });
        }
    }

    async searchEmails(req, res, query) {
        const searchQuery = query.q || '';
        const results = this.emailService.searchEmails(searchQuery);
        this.sendResponse(res, 200, { results, query: searchQuery });
    }

    getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                resolve(body);
            });
            req.on('error', reject);
        });
    }

    sendResponse(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

module.exports = APIServer;