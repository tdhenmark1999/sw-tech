import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DropdownItem {
  id?: number;
  name: string;
  value: string;
  type?: string; 
  fundId?: number; 
}

export interface DropdownResponse {
  data: DropdownItem[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DropdownService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getDropdownData(category: string, search?: string): Observable<DropdownResponse> {
    let url = `${this.baseUrl}/dropdown/${category}`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    return this.http.get<DropdownResponse>(url);
  }

  saveDropdownData(category: string, items: DropdownItem[]): Observable<DropdownResponse> {
    return this.http.post<DropdownResponse>(`${this.baseUrl}/dropdown/${category}`, {
      items
    });
  }
}