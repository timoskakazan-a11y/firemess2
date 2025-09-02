import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from './models/user.model';
import { NotionService } from './services/notion.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
})
export class AppComponent implements OnInit {
  private notionService = inject(NotionService);

  users = signal<User[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  isModalOpen = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  currentUser = signal<User | null>(null);

  userForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true }),
    avatarUrl: new FormControl('', { nonNullable: true }),
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.error.set(null);
    this.notionService.getUsers()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (users) => this.users.set(users),
        error: (err) => this.error.set(err.message),
      });
  }

  openModal(user: User | null = null) {
    this.currentUser.set(user);
    if (user) {
      this.userForm.setValue({
        name: user.name,
        email: user.email,
        password: user.password || '',
        avatarUrl: user.avatarUrl || '',
      });
    } else {
      this.userForm.reset();
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.currentUser.set(null);
    this.userForm.reset();
  }

  saveUser() {
    if (this.userForm.invalid) {
      return;
    }
    this.isSaving.set(true);
    const formValue = this.userForm.getRawValue();
    const userToSave: Partial<User> = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        avatarUrl: formValue.avatarUrl || null // Send null to clear
    };

    const existingUser = this.currentUser();
    const saveOperation$ = existingUser
      ? this.notionService.updateUser(existingUser.id, userToSave)
      : this.notionService.createUser(userToSave);

    saveOperation$
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (savedUser) => {
          if (existingUser) {
            this.users.update(users => users.map(u => u.id === savedUser.id ? savedUser : u));
          } else {
            this.users.update(users => [...users, savedUser]);
          }
          this.closeModal();
        },
        error: (err) => {
            this.error.set(`Failed to save user: ${err.message}`);
            // Keep modal open on error to allow user to retry
        }
      });
  }
}
