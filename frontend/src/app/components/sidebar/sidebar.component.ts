import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmailService } from '../../services/email.service';
import { EmailFolder, EmailLabel } from '../../models/email.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  folders: EmailFolder[] = [];
  labels: EmailLabel[] = [];
  
  constructor(
    private emailService: EmailService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // For now, use static data until we have the backend
    this.folders = [
      { id: 'inbox', name: 'Inbox', count: 12, unreadCount: 3 },
      { id: 'sent', name: 'Sent', count: 5 },
      { id: 'drafts', name: 'Drafts', count: 2 },
      { id: 'trash', name: 'Trash', count: 8 }
    ];
    
    this.labels = [
      { id: 'work', name: 'Work', color: '#4285F4' },
      { id: 'personal', name: 'Personal', color: '#0F9D58' },
      { id: 'important', name: 'Important', color: '#DB4437' }
    ];
    
    // When backend is ready, use this:
    /*
    this.emailService.getFolders().subscribe(folders => {
      this.folders = folders;
    });
    
    this.emailService.getLabels().subscribe(labels => {
      this.labels = labels;
    });
    */
  }

  navigateToFolder(folderId: string): void {
    this.router.navigate(['/folder', folderId]);
  }
  
  navigateToLabel(labelId: string): void {
    this.router.navigate(['/label', labelId]);
  }
  
  composeEmail(): void {
    this.router.navigate(['/compose']);
  }
}