export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  signature?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  emailsPerPage: number;
  showUnreadFirst: boolean;
  defaultSignature: string;
  notificationsEnabled: boolean;
}