import { ISystem } from './system';
import { Validators, FormBuilder } from '@angular/forms';

export interface IPlanner {
  id?: number;
  documentId?: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  description: string;
  plannerType: string;
  externalSystemConfig: ISystem | null;
  funds: {
    fund: string
    alias: string
  }[]
  trigger: {
    runs: boolean
    reports: boolean
    sources: boolean
  }
  sources: string[]
  runs: {
    name: string
    value: string
  }[]
  reports: {
    name: string
    value: string
  }[]
}

export interface IPlannerResponse {
  data: IPlanner[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export const createPlannerForm = (formBuilder: FormBuilder) => {
  return formBuilder.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    plannerType: ['', Validators.required],
    externalSystemConfig: [null],
    funds: formBuilder.array([]),
    trigger: formBuilder.group({
      sources: [false],
      runs: [false],
      reports: [false]
    }),
    sources: [[]],
    runs: formBuilder.array([]),
    reports: formBuilder.array([])
  });
};
