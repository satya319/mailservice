import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { InboxComponent } from './components/inbox/inbox.component';
import { EmailViewComponent } from './components/email-view/email-view.component';
import { ComposeComponent } from './components/compose/compose.component';
import { SettingsComponent } from './components/settings/settings.component';

import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/inbox', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'inbox', 
    component: InboxComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'email/:id', 
    component: EmailViewComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'compose', 
    component: ComposeComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'compose/:id', 
    component: ComposeComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'settings', 
    component: SettingsComponent, 
    canActivate: [AuthGuard] 
  },
  { path: '**', redirectTo: '/inbox' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }