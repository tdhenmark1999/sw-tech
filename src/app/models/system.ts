import { Validators} from '@angular/forms';

export interface ISystem {
  id?: number;
  documentId?: number;
  name: string;
  baseUrl: string;
  authenticationMethod: string;
  authenticationPlace: string;
  key: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface ISystemsResponse {
  data: ISystem[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export const SystemForm = {
  name: ['', Validators.required],
  baseUrl: ['', Validators.required],
  authenticationMethod: ['', Validators.required],
  authenticationPlace: ['', Validators.required],
  key: ['', Validators.required],
  value: ['', Validators.required],
}
