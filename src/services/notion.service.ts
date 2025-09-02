import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { User, NotionUserProperties } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class NotionService {
  private http = inject(HttpClient);
  
  private apiUrl = '/api'; // Use the Vercel proxy
  private databaseId = '25d0d1b6cd91800babc2c0650dfa49b9';

  private handleError(error: any) {
    console.error('Error from Notion API proxy:', error);
    const errorMsg = error.error?.message || error.message || 'An unknown error occurred.';
    return throwError(() => new Error(errorMsg));
  }

  // Helper to map Notion's complex API response to our simple User object
  private fromNotionObject(notionPage: any): User {
    const props = notionPage.properties as NotionUserProperties;
    return {
      id: notionPage.id,
      name: props['Имя']?.title[0]?.text.content || '',
      email: props['Почта']?.email || '',
      password: props['Пароль']?.rich_text[0]?.text.content || '',
      avatarUrl: props['Аватар']?.url || `https://i.pravatar.cc/150?u=${notionPage.id}`,
    };
  }

  // Helper to map our User object to Notion's complex API request structure
  private toNotionObject(user: Partial<User>): { [key: string]: any } {
    const properties: Partial<NotionUserProperties> = {};
    if (user.name) {
      properties['Имя'] = { title: [{ text: { content: user.name } }] };
    }
    if (user.email) {
      properties['Почта'] = { email: user.email };
    }
    if (user.password) {
      properties['Пароль'] = { rich_text: [{ text: { content: user.password } }] };
    }
    if (user.avatarUrl) {
      properties['Аватар'] = { url: user.avatarUrl };
    } else {
      properties['Аватар'] = { url: null }; // Clear avatar if not provided
    }
    return properties;
  }

  getUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/databases/${this.databaseId}/query`;
    // An empty body for query is required for POST request
    return this.http.post<any>(url, {}).pipe(
      map(response => response.results.map(this.fromNotionObject)),
      catchError(this.handleError)
    );
  }

  createUser(user: Partial<User>): Observable<User> {
    const url = `${this.apiUrl}/pages`;
    const body = {
      parent: { database_id: this.databaseId },
      properties: this.toNotionObject(user),
    };
    return this.http.post<any>(url, body).pipe(
      map(this.fromNotionObject),
      catchError(this.handleError)
    );
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    const url = `${this.apiUrl}/pages/${id}`;
    const body = {
      properties: this.toNotionObject(user),
    };
    return this.http.patch<any>(url, body).pipe(
      map(this.fromNotionObject),
      catchError(this.handleError)
    );
  }
}
