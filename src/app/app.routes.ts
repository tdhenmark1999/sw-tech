import { Routes } from '@angular/router';
import { ExternalSystemComponent } from './components/external-system/external-system.component';
import { PlannerComponent } from './components/planner/planner.component';
import { DataManagementComponent } from './components/data-management/data-management.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'external', 
    pathMatch: 'full' 
  },
  { 
    path: 'external', 
    component: ExternalSystemComponent 
  },
  { 
    path: 'planner', 
    component: PlannerComponent 
  },
  { 
    path: 'data-management', 
    component: DataManagementComponent 
  },
];
