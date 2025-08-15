import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { ISystem, ISystemsResponse } from '../models/system';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private apiUrl = `${environment.apiUrl}/systems`;

  constructor(private http: HttpClient) { }

  async getSystems(): Promise<ISystemsResponse> {
    return firstValueFrom(
      this.http.get<ISystemsResponse>(this.apiUrl).pipe(
        catchError(this.handleError)
      )
    );
  }

  async createSystem(system: ISystem): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(this.apiUrl, { data: system }).pipe(
        catchError(this.handleError)
      )
    );
  }

  async updateSystem(system: ISystem, documentId: string): Promise<any> {
    return firstValueFrom(
      this.http.put<any>(`${this.apiUrl}/${documentId}`, { data: system }).pipe(
        catchError(this.handleError)
      )
    );
  }

  async deleteSystem(documentId: string): Promise<any> {
    return firstValueFrom(
      this.http.delete<any>(`${this.apiUrl}/${documentId}`).pipe(
        catchError(this.handleError)
      )
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => new Error(error.error?.error || error.message || 'Server error'));
  }
}
