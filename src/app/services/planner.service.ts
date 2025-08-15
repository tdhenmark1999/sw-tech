import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { IPlannerResponse, IPlanner } from '../models/planner';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment'
@Injectable({
  providedIn: 'root'
})
export class PlannerService {
  private apiUrl = `${environment.apiUrl}/planners`;

  constructor(private http: HttpClient) { }

  async getPlanners(page = 1, pageSize = 10, search = ''): Promise<IPlannerResponse> {
    let url = `${this.apiUrl}?pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    
    return firstValueFrom(
      this.http.get<IPlannerResponse>(url).pipe(
        catchError(this.handleError)
      )
    );
  }

  async createPlanner(planner: IPlanner): Promise<IPlannerResponse> {
    return firstValueFrom(
      this.http.post<IPlannerResponse>(this.apiUrl, { data: planner }).pipe(
        catchError(this.handleError)
      )
    );
  }

  async updatePlanner(planner: IPlanner, documentId: string): Promise<IPlannerResponse> {
    return firstValueFrom(
      this.http.put<IPlannerResponse>(`${this.apiUrl}/${documentId}`, { data: planner }).pipe(
        catchError(this.handleError)
      )
    );
  }

  async deletePlanner(documentId: string): Promise<IPlannerResponse> {
    return firstValueFrom(
      this.http.delete<IPlannerResponse>(`${this.apiUrl}/${documentId}`).pipe(
        catchError(this.handleError)
      )
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => new Error(error.message || 'Server error'));
  }
}
