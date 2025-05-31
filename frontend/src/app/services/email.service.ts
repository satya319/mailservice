import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Email, EmailDraft, Attachment, EmailFolder, EmailLabel } from '../models/email.model';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get emails by folder
  getEmails(folder: string, page: number = 1, limit: number = 20): Observable<Email[]> {
    return this.http.get<Email[]>(`${this.apiUrl}/emails`, {
      params: {
        folder,
        page: page.toString(),
        limit: limit.toString()
      }
    });
  }

  // Get a single email by ID
  getEmail(id: string): Observable<Email> {
    return this.http.get<Email>(`${this.apiUrl}/emails/${id}`);
  }

  // Send a new email
  sendEmail(email: EmailDraft): Observable<any> {
    return this.http.post(`${this.apiUrl}/emails/send`, email);
  }

  // Save email as draft
  saveDraft(draft: EmailDraft): Observable<EmailDraft> {
    if (draft.id) {
      return this.http.put<EmailDraft>(`${this.apiUrl}/drafts/${draft.id}`, draft);
    } else {
      return this.http.post<EmailDraft>(`${this.apiUrl}/drafts`, draft);
    }
  }

  // Get draft by ID
  getDraft(id: string): Observable<EmailDraft> {
    return this.http.get<EmailDraft>(`${this.apiUrl}/drafts/${id}`);
  }

  // Get all drafts
  getDrafts(): Observable<EmailDraft[]> {
    return this.http.get<EmailDraft[]>(`${this.apiUrl}/drafts`);
  }

  // Delete draft
  deleteDraft(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/drafts/${id}`);
  }

  // Mark email as read
  markAsRead(id: string, read: boolean = true): Observable<any> {
    return this.http.patch(`${this.apiUrl}/emails/${id}`, { read });
  }

  // Star/unstar email
  toggleStar(id: string, starred: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/emails/${id}`, { starred });
  }

  // Move email to folder
  moveToFolder(id: string, folder: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/emails/${id}`, { folder });
  }

  // Delete email (move to trash)
  deleteEmail(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/emails/${id}`, { folder: 'trash' });
  }

  // Permanently delete email
  permanentlyDeleteEmail(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/emails/${id}`);
  }

  // Upload attachment
  uploadAttachment(file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<Attachment>(`${this.apiUrl}/attachments`, formData);
  }

  // Get attachment
  getAttachment(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/attachments/${id}`, {
      responseType: 'blob'
    });
  }

  // Get folders
  getFolders(): Observable<EmailFolder[]> {
    return this.http.get<EmailFolder[]>(`${this.apiUrl}/folders`);
  }

  // Get labels
  getLabels(): Observable<EmailLabel[]> {
    return this.http.get<EmailLabel[]>(`${this.apiUrl}/labels`);
  }

  // Create label
  createLabel(label: Omit<EmailLabel, 'id'>): Observable<EmailLabel> {
    return this.http.post<EmailLabel>(`${this.apiUrl}/labels`, label);
  }

  // Update label
  updateLabel(id: string, label: Partial<EmailLabel>): Observable<EmailLabel> {
    return this.http.put<EmailLabel>(`${this.apiUrl}/labels/${id}`, label);
  }

  // Delete label
  deleteLabel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/labels/${id}`);
  }

  // Add label to email
  addLabelToEmail(emailId: string, labelId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/emails/${emailId}/labels`, { labelId });
  }

  // Remove label from email
  removeLabelFromEmail(emailId: string, labelId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/emails/${emailId}/labels/${labelId}`);
  }

  // Search emails
  searchEmails(query: string, page: number = 1, limit: number = 20): Observable<Email[]> {
    return this.http.get<Email[]>(`${this.apiUrl}/emails/search`, {
      params: {
        q: query,
        page: page.toString(),
        limit: limit.toString()
      }
    });
  }
}