// API Configuration
const API_BASE_URL = 'http://localhost:3002/api';

// Email data cache
let emails = {
    inbox: [],
    sent: [],
    drafts: [],
    trash: []
};

let currentFolder = 'inbox';
let selectedEmails = new Set();
let attachments = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadEmails(currentFolder);
    setupEventListeners();
    checkAPIConnection();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchEmails(this.value);
        }
    });

    // File drag and drop
    const attachmentArea = document.querySelector('.attachment-area');
    if (attachmentArea) {
        attachmentArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--primary-color)';
            this.style.backgroundColor = 'var(--hover-color)';
        });

        attachmentArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.backgroundColor = 'transparent';
        });

        attachmentArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.backgroundColor = 'transparent';
            
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });
    }
}

function showFolder(folder) {
    // Update active sidebar item
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.sidebar-item').classList.add('active');
    
    currentFolder = folder;
    loadEmails(folder);
}

async function loadEmails(folder) {
    const emailList = document.getElementById('emailList');
    
    try {
        // Show loading state
        emailList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #5f6368;">
                <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #f3f3f3; border-top: 3px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p>Loading emails...</p>
            </div>
        `;
        
        const response = await fetch(`${API_BASE_URL}/emails?folder=${folder}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load emails');
        }
        
        const folderEmails = data.emails || [];
        emails[folder] = folderEmails; // Cache the emails
        
        if (folderEmails.length === 0) {
            emailList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #5f6368;">
                    <i class="material-icons" style="font-size: 48px; margin-bottom: 16px;">inbox</i>
                    <p>No emails in ${folder}</p>
                </div>
            `;
            return;
        }
        
        emailList.innerHTML = folderEmails.map(email => `
            <div class="email-item ${!email.read ? 'unread' : ''}" onclick="openEmail(${email.id})">
                <input type="checkbox" class="email-checkbox" onclick="event.stopPropagation(); toggleEmailSelection(${email.id})">
                <i class="material-icons email-star ${email.starred ? 'starred' : ''}" onclick="event.stopPropagation(); toggleStar(${email.id})">
                    ${email.starred ? 'star' : 'star_border'}
                </i>
                <div class="email-sender">${email.from}</div>
                <div class="email-subject">
                    <strong>${email.subject}</strong>
                    <span style="color: #5f6368; font-weight: normal;"> - ${email.body.substring(0, 50)}...</span>
                </div>
                <div class="email-date">${formatDate(new Date(email.date))}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading emails:', error);
        emailList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger-color);">
                <i class="material-icons" style="font-size: 48px; margin-bottom: 16px;">error</i>
                <p>Error loading emails: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadEmails('${folder}')">Retry</button>
            </div>
        `;
    }
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function openEmail(emailId) {
    const email = findEmailById(emailId);
    if (!email) return;
    
    // Mark as read
    email.read = true;
    loadEmails(currentFolder);
    
    // Create email view modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">${email.subject}</div>
                <button class="close-button" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                    <div><strong>From:</strong> ${email.from}</div>
                    <div><strong>To:</strong> ${email.to}</div>
                    <div><strong>Date:</strong> ${email.date.toLocaleString()}</div>
                </div>
                <div style="white-space: pre-wrap; line-height: 1.6;">${email.body}</div>
                ${email.attachments && email.attachments.length > 0 ? `
                    <div style="margin-top: 20px;">
                        <strong>Attachments:</strong>
                        ${email.attachments.map(att => `
                            <div style="margin-top: 8px;">
                                <i class="material-icons" style="vertical-align: middle;">attach_file</i>
                                <span>${att.name}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <div>
                    <button class="btn btn-secondary" onclick="replyToEmail(${emailId})">Reply</button>
                    <button class="btn btn-secondary" onclick="forwardEmail(${emailId})">Forward</button>
                </div>
                <div>
                    <button class="btn btn-secondary" onclick="deleteEmail(${emailId}); this.closest('.modal').remove()">Delete</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function findEmailById(id) {
    for (const folder in emails) {
        const email = emails[folder].find(e => e.id === id);
        if (email) return email;
    }
    return null;
}

// toggleStar function moved to async version below

function toggleEmailSelection(emailId) {
    if (selectedEmails.has(emailId)) {
        selectedEmails.delete(emailId);
    } else {
        selectedEmails.add(emailId);
    }
}

// deleteEmail function moved to async version below

function openComposeModal() {
    document.getElementById('composeModal').classList.add('show');
    document.getElementById('toField').focus();
}

function closeComposeModal() {
    document.getElementById('composeModal').classList.remove('show');
    clearComposeForm();
}

function clearComposeForm() {
    document.getElementById('composeForm').reset();
    attachments = [];
    updateAttachmentList();
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    files.forEach(file => {
        if (file.size > 25 * 1024 * 1024) { // 25MB limit
            showNotification('File too large: ' + file.name, 'error');
            return;
        }
        
        attachments.push({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        });
    });
    
    updateAttachmentList();
}

function updateAttachmentList() {
    const attachmentList = document.getElementById('attachmentList');
    
    if (attachments.length === 0) {
        attachmentList.innerHTML = '';
        return;
    }
    
    attachmentList.innerHTML = `
        <div style="margin-top: 12px;">
            <strong>Attached files:</strong>
            ${attachments.map((att, index) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background-color: var(--secondary-color); border-radius: 4px; margin-top: 4px;">
                    <div>
                        <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">attach_file</i>
                        <span>${att.name}</span>
                        <span style="color: #5f6368; font-size: 12px;"> (${formatFileSize(att.size)})</span>
                    </div>
                    <button type="button" onclick="removeAttachment(${index})" style="background: none; border: none; color: #5f6368; cursor: pointer;">
                        <i class="material-icons">close</i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function removeAttachment(index) {
    attachments.splice(index, 1);
    updateAttachmentList();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function sendEmail() {
    const to = document.getElementById('toField').value;
    const cc = document.getElementById('ccField').value;
    const subject = document.getElementById('subjectField').value;
    const body = document.getElementById('bodyField').value;
    
    if (!to || !subject || !body) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Show sending state
        const sendButton = document.querySelector('.btn-primary');
        const originalText = sendButton.textContent;
        sendButton.textContent = 'Sending...';
        sendButton.disabled = true;
        
        const emailData = {
            to: to,
            cc: cc || undefined,
            subject: subject,
            body: body,
            attachments: attachments.map(att => ({
                name: att.name,
                size: att.size,
                type: att.type,
                content: att.content || '' // Base64 content
            }))
        };
        
        const response = await fetch(`${API_BASE_URL}/emails/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to send email');
        }
        
        showNotification('Email sent successfully!', 'success');
        closeComposeModal();
        
        // If currently viewing sent folder, refresh the list
        if (currentFolder === 'sent') {
            loadEmails('sent');
        }
        
    } catch (error) {
        console.error('Error sending email:', error);
        showNotification('Failed to send email: ' + error.message, 'error');
        
        // Reset button
        const sendButton = document.querySelector('.btn-primary');
        sendButton.textContent = 'Send';
        sendButton.disabled = false;
    }
}

// saveDraft function moved to async version below

function replyToEmail(emailId) {
    const email = findEmailById(emailId);
    if (!email) return;
    
    // Close email view modal
    document.querySelector('.modal').remove();
    
    // Open compose modal with reply data
    openComposeModal();
    
    document.getElementById('toField').value = email.from;
    document.getElementById('subjectField').value = email.subject.startsWith('Re: ') ? email.subject : 'Re: ' + email.subject;
    document.getElementById('bodyField').value = `\n\n--- Original Message ---\nFrom: ${email.from}\nDate: ${email.date.toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`;
}

function forwardEmail(emailId) {
    const email = findEmailById(emailId);
    if (!email) return;
    
    // Close email view modal
    document.querySelector('.modal').remove();
    
    // Open compose modal with forward data
    openComposeModal();
    
    document.getElementById('subjectField').value = email.subject.startsWith('Fwd: ') ? email.subject : 'Fwd: ' + email.subject;
    document.getElementById('bodyField').value = `\n\n--- Forwarded Message ---\nFrom: ${email.from}\nTo: ${email.to}\nDate: ${email.date.toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`;
}

function searchEmails(query) {
    if (!query.trim()) {
        loadEmails(currentFolder);
        return;
    }
    
    const emailList = document.getElementById('emailList');
    const allEmails = Object.values(emails).flat();
    const searchResults = allEmails.filter(email => 
        email.subject.toLowerCase().includes(query.toLowerCase()) ||
        email.body.toLowerCase().includes(query.toLowerCase()) ||
        email.from.toLowerCase().includes(query.toLowerCase())
    );
    
    if (searchResults.length === 0) {
        emailList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #5f6368;">
                <i class="material-icons" style="font-size: 48px; margin-bottom: 16px;">search</i>
                <p>No emails found for "${query}"</p>
            </div>
        `;
        return;
    }
    
    emailList.innerHTML = searchResults.map(email => `
        <div class="email-item ${!email.read ? 'unread' : ''}" onclick="openEmail(${email.id})">
            <input type="checkbox" class="email-checkbox" onclick="event.stopPropagation(); toggleEmailSelection(${email.id})">
            <i class="material-icons email-star ${email.starred ? 'starred' : ''}" onclick="event.stopPropagation(); toggleStar(${email.id})">
                ${email.starred ? 'star' : 'star_border'}
            </i>
            <div class="email-sender">${email.from}</div>
            <div class="email-subject">
                <strong>${email.subject}</strong>
                <span style="color: #5f6368; font-weight: normal;"> - ${email.body.substring(0, 50)}...</span>
            </div>
            <div class="email-date">${formatDate(email.date)}</div>
        </div>
    `).join('');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        background-color: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function checkAPIConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ API connection successful');
            showNotification('Connected to email server', 'success');
        } else {
            throw new Error('API health check failed');
        }
    } catch (error) {
        console.error('❌ API connection failed:', error);
        showNotification('Failed to connect to email server. Using offline mode.', 'error');
    }
}

async function saveDraft() {
    const to = document.getElementById('toField').value;
    const cc = document.getElementById('ccField').value;
    const subject = document.getElementById('subjectField').value;
    const body = document.getElementById('bodyField').value;
    
    if (!to && !subject && !body) {
        showNotification('Nothing to save', 'error');
        return;
    }
    
    try {
        const draftData = {
            to: to || '',
            cc: cc || '',
            subject: subject || '(No subject)',
            body: body || '',
            attachments: attachments.map(att => ({
                name: att.name,
                size: att.size,
                type: att.type,
                content: att.content || ''
            }))
        };
        
        const response = await fetch(`${API_BASE_URL}/emails/draft`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(draftData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to save draft');
        }
        
        showNotification('Draft saved', 'success');
        closeComposeModal();
        
        if (currentFolder === 'drafts') {
            loadEmails('drafts');
        }
        
    } catch (error) {
        console.error('Error saving draft:', error);
        showNotification('Failed to save draft: ' + error.message, 'error');
    }
}

async function toggleStar(emailId) {
    try {
        const email = findEmailById(emailId);
        if (!email) return;
        
        const response = await fetch(`${API_BASE_URL}/emails/${emailId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ starred: !email.starred })
        });
        
        if (response.ok) {
            email.starred = !email.starred;
            loadEmails(currentFolder);
        }
    } catch (error) {
        console.error('Error toggling star:', error);
        showNotification('Failed to update email', 'error');
    }
}

async function deleteEmail(emailId) {
    try {
        const response = await fetch(`${API_BASE_URL}/emails/${emailId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folder: currentFolder })
        });
        
        if (response.ok) {
            loadEmails(currentFolder);
            showNotification('Email moved to trash');
        } else {
            throw new Error('Failed to delete email');
        }
    } catch (error) {
        console.error('Error deleting email:', error);
        showNotification('Failed to delete email', 'error');
    }
}

async function searchEmails(query) {
    if (!query.trim()) {
        loadEmails(currentFolder);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/emails/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }
        
        const emailList = document.getElementById('emailList');
        const searchResults = data.results || [];
        
        if (searchResults.length === 0) {
            emailList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #5f6368;">
                    <i class="material-icons" style="font-size: 48px; margin-bottom: 16px;">search</i>
                    <p>No emails found for "${query}"</p>
                </div>
            `;
            return;
        }
        
        emailList.innerHTML = searchResults.map(email => `
            <div class="email-item ${!email.read ? 'unread' : ''}" onclick="openEmail(${email.id})">
                <input type="checkbox" class="email-checkbox" onclick="event.stopPropagation(); toggleEmailSelection(${email.id})">
                <i class="material-icons email-star ${email.starred ? 'starred' : ''}" onclick="event.stopPropagation(); toggleStar(${email.id})">
                    ${email.starred ? 'star' : 'star_border'}
                </i>
                <div class="email-sender">${email.from}</div>
                <div class="email-subject">
                    <strong>${email.subject}</strong>
                    <span style="color: #5f6368; font-weight: normal;"> - ${email.body.substring(0, 50)}...</span>
                </div>
                <div class="email-date">${formatDate(new Date(email.date))}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error searching emails:', error);
        showNotification('Search failed: ' + error.message, 'error');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);