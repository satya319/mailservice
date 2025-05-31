import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { Auth } from 'aws-amplify';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.checkAuthStatus();
  }

  async checkAuthStatus() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const userModel: User = {
        id: user.attributes.sub,
        email: user.attributes.email,
        firstName: user.attributes.given_name || '',
        lastName: user.attributes.family_name || ''
      };
      this.currentUserSubject.next(userModel);
    } catch (error) {
      this.currentUserSubject.next(null);
    }
  }

  login(email: string, password: string): Observable<any> {
    return from(Auth.signIn(email, password).then(user => {
      this.checkAuthStatus();
      return user;
    }));
  }

  register(email: string, password: string, firstName: string, lastName: string): Observable<any> {
    return from(Auth.signUp({
      username: email,
      password,
      attributes: {
        email,
        given_name: firstName,
        family_name: lastName
      }
    }));
  }

  confirmRegistration(email: string, code: string): Observable<any> {
    return from(Auth.confirmSignUp(email, code));
  }

  resendConfirmationCode(email: string): Observable<any> {
    return from(Auth.resendSignUp(email));
  }

  forgotPassword(email: string): Observable<any> {
    return from(Auth.forgotPassword(email));
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<any> {
    return from(Auth.forgotPasswordSubmit(email, code, newPassword));
  }

  logout(): Observable<any> {
    return from(Auth.signOut().then(() => {
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    }));
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}