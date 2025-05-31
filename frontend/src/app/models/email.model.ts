export interface Email {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: Attachment[];
  date: Date;
  read: boolean;
  starred: boolean;
  labels?: string[];
  folder: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface EmailFolder {
  id: string;
  name: string;
  count: number;
  unreadCount?: number;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string;
}

export interface EmailDraft {
  id?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: Attachment[];
  lastSaved?: Date;
}