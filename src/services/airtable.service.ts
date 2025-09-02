import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError, forkJoin, of, switchMap } from 'rxjs';
import { User, Message } from '../models/chat.model';

// Define interfaces for Airtable's specific response structure
interface AirtableRecord<T> {
  id: string;
  createdTime: string;
  fields: T;
}

interface AirtableResponse<T> {
  records: AirtableRecord<T>[];
}

export interface AppData {
  users: User[];
  messages: Message[];
  images: Record<string, string>;
}

export interface AirtableDataIds {
    usersRecordId: string;
    messagesRecordId: string;
}

@Injectable({
  providedIn: 'root',
})
export class AirtableService {
  private http = inject(HttpClient);
  
  // Airtable configuration from user prompt
  private apiKey = 'patgH8WSF4ElN8408.41a6420f51d0a013c86f0b712c595388b50d44e1b7cba20a1a9b7e4c3a797264';
  private baseId = 'appouwrkbKNepNYyB';
  private apiUrl = `https://api.airtable.com/v0/${this.baseId}`;
  
  // Table names
  private usersTable = 'пользователи';
  private messagesTable = 'сообщения';

  private getHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    });
  }

  private handleError(error: any) {
    console.error('Error from Airtable API:', error);
    const errorMsg = error.error?.error?.message || error.message || 'An unknown error occurred with the Airtable API.';
    return throwError(() => new Error(errorMsg));
  }

  // Fetches the single record from a table.
  private getRecord(tableName: string, filterByFormula?: string): Observable<AirtableRecord<any>> {
    let url = `${this.apiUrl}/${tableName}?maxRecords=1`;
    if (filterByFormula) {
        url += `&filterByFormula=${encodeURIComponent(filterByFormula)}`;
    }
    return this.http.get<AirtableResponse<any>>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (!response.records || response.records.length === 0) {
          throw new Error(`No record found in table "${tableName}" with formula "${filterByFormula || ''}".`);
        }
        return response.records[0];
      }),
      catchError(this.handleError)
    );
  }

  getAppData(): Observable<{data: {users: string, messages: string, images: string}, ids: AirtableDataIds}> {
    const users$ = this.getRecord(this.usersTable, "{Регион}='Россия'");
    const messages$ = this.getRecord(this.messagesTable);

    return forkJoin({
      userRecord: users$,
      messageRecord: messages$,
    }).pipe(
      map(({ userRecord, messageRecord }) => {
        return {
          data: {
            users: userRecord.fields['Пользователи'] || '[]',
            messages: messageRecord.fields['Сообщения'] || '[]',
            images: messageRecord.fields['Фото/Видео'] || '{}',
          },
          ids: {
            usersRecordId: userRecord.id,
            messagesRecordId: messageRecord.id,
          }
        };
      })
    );
  }

  updateMessages(recordId: string, encryptedMessages: string, encryptedImages: string): Observable<void> {
    const url = `${this.apiUrl}/${this.messagesTable}/${recordId}`;
    const body = {
      fields: {
        'Сообщения': encryptedMessages,
        'Фото/Видео': encryptedImages,
      },
    };
    return this.http.patch<void>(url, body, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
}
