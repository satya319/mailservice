# CustomMail - Serverless Email Service

A self-hosted email service with Gmail-like functionality using serverless architecture.

## Architecture

- **Frontend**: Angular-based web application
- **Backend**: AWS Serverless (Lambda, API Gateway)
- **Email Processing**: Amazon SES (Simple Email Service)
- **Storage**: DynamoDB
- **Authentication**: Amazon Cognito
- **File Storage**: Amazon S3 (for attachments)

## Components

### Frontend
- Angular web application
- Responsive design
- Rich text editor for composing emails
- Attachment handling

### Backend
- Lambda functions for API endpoints
- SES for sending and receiving emails
- DynamoDB for storing email metadata
- S3 for storing email content and attachments

### Infrastructure
- CloudFormation/SAM templates for AWS resources
- API Gateway configuration
- IAM roles and policies

## Features

- Custom domain email (e.g., me@yourdomain.com)
- Compose, send, receive, and manage emails
- Attachment support
- Spam filtering
- Draft saving and editing
- Search functionality
- User authentication
- Email encryption
- Admin controls

## Setup Instructions

(Detailed setup instructions will be added here)

## Development

(Development instructions will be added here)# mailservice
