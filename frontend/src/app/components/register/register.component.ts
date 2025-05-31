import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  showConfirmation = false;
  email = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.mustMatch('password', 'confirmPassword')
    });
  }

  ngOnInit(): void {
  }

  // Custom validator to check if passwords match
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        // Return if another validator has already found an error
        return;
      }

      // Set error on matchingControl if validation fails
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  // Convenience getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.register(
      this.f['email'].value,
      this.f['password'].value,
      this.f['firstName'].value,
      this.f['lastName'].value
    ).subscribe({
      next: () => {
        this.showConfirmation = true;
        this.email = this.f['email'].value;
        this.loading = false;
      },
      error: error => {
        this.error = error.message || 'Registration failed';
        this.loading = false;
      }
    });
  }

  onConfirmCode(code: string) {
    this.loading = true;
    this.authService.confirmRegistration(this.email, code).subscribe({
      next: () => {
        this.router.navigate(['/login'], { queryParams: { registered: true } });
      },
      error: error => {
        this.error = error.message || 'Confirmation failed';
        this.loading = false;
      }
    });
  }

  resendCode() {
    this.loading = true;
    this.authService.resendConfirmationCode(this.email).subscribe({
      next: () => {
        this.loading = false;
      },
      error: error => {
        this.error = error.message || 'Failed to resend code';
        this.loading = false;
      }
    });
  }
}