import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClientModule } from '@angular/common/http';
import { PlannerHeaderComponent } from '../header/planner-header.component';
import { PLANNER_TYPES } from '../../constants';
import { SystemService } from '../../services/system.service';
import { PlannerService } from '../../services/planner.service';
import { DropdownService } from '../../services/dropdown.service';
import { ISystem } from '../../models/system';
import { createPlannerForm, IPlanner } from '../../models/planner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatCheckboxModule,
    HttpClientModule,
    PlannerHeaderComponent,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.scss']
})
export class PlannerComponent implements OnInit {
  formBuilder = inject(FormBuilder);
  plannerForm: FormGroup = createPlannerForm(this.formBuilder);
  plannerService = inject(PlannerService);
  systemService = inject(SystemService);
  dropdownService = inject(DropdownService);
  private cdr = inject(ChangeDetectorRef);
  isLoading = false;

  get fundsArray() {
    return this.plannerForm.get('funds') as FormArray;
  }

  get sourcesValue() {
    return this.plannerForm.get('sources')?.value || [];
  }

  get runsArray() {
    return this.plannerForm.get('runs') as FormArray;
  }

  get reportsArray() {
    return this.plannerForm.get('reports') as FormArray;
  }

  planners: IPlanner[] = [];
  plannerTypes = PLANNER_TYPES;
  fundTypes: any[] = [];
  fundAliasTypes: any[] = [];
  sourceTypes: any[] = [];
  runTypes: any[] = [];
  reportTypes: any[] = [];
  filteredPlanners: IPlanner[] = [];
  systems: ISystem[] = [];
  selectedPlanner: IPlanner | null = null;
  private isSelecting = false;
  private selectionTimeout: any;
  private expandedPanels: Set<number> = new Set();
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25];
  totalPlanners = 0;
  currentSearch = '';

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.loadDropdownData();
    await this.loadPlanners();
    await this.loadSystems();
  }

  private async loadDropdownData() {
    try {
      
      const [sourcesRes, runsRes, reportsRes, fundsRes, fundAliasesRes] = await Promise.all([
        this.dropdownService.getDropdownData('sources').toPromise(),
        this.dropdownService.getDropdownData('runs').toPromise(),
        this.dropdownService.getDropdownData('reports').toPromise(),
        this.dropdownService.getDropdownData('funds').toPromise(),
        this.dropdownService.getDropdownData('fundAliases').toPromise()
      ]);

      
      if (sourcesRes?.data) {
        this.sourceTypes = sourcesRes.data.map(item => ({ name: item.name, value: item.value }));
      }
      if (runsRes?.data) {
        this.runTypes = runsRes.data.map(item => ({ name: item.name, value: item.value }));
      }
      if (reportsRes?.data) {
        this.reportTypes = reportsRes.data.map(item => ({ name: item.name, value: item.value, type: item.type }));
      }
      if (fundsRes?.data) {
        this.fundTypes = fundsRes.data.map(item => ({ name: item.name, value: item.value }));
      }
      if (fundAliasesRes?.data) {
        this.fundAliasTypes = fundAliasesRes.data.map(item => ({ name: item.name, value: item.value }));
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      
    }
  }

  async loadPlanners(search = '') {
    try {
      this.isLoading = true;
      const response = await this.plannerService.getPlanners(this.pageIndex + 1, this.pageSize, search);
      this.planners = response.data;
      this.totalPlanners = response.meta.pagination.total;
      this.filteredPlanners = [...this.planners];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading planners:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadSystems() {
    try {
      const response = await this.systemService.getSystems();
      this.systems = response.data;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading systems:', error);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadPlanners(this.currentSearch);
  }

  private updatePaginatedPlanners() {
    this.filteredPlanners = [...this.planners];
  }

  onSearch(searchTerm: string) {
    this.currentSearch = searchTerm;
    this.pageIndex = 0; 
    this.loadPlanners(searchTerm);
  }

  createNewPlanner() {
    const newPlanner: IPlanner = {
      name: '',
      description: '',
      plannerType: '',
      externalSystemConfig: null,
      funds: [],
      trigger: {
        sources: false,
        runs: false,
        reports: false
      },
      sources: [],
      runs: [],
      reports: []
    };
    
    this.selectedPlanner = newPlanner;
    this.plannerForm = createPlannerForm(this.formBuilder);
    this.filteredPlanners = [...this.filteredPlanners, newPlanner];
  }

  onAccordionOpened(planner: IPlanner) {
    if (!planner.id) {
      return;
    }

    if (this.expandedPanels.has(planner.id)) {
      return;
    }

    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }
    
    this.selectionTimeout = setTimeout(() => {
      this.selectPlanner(planner);
      if (planner.id) {
        this.expandedPanels.add(planner.id);
      }
    }, 100);
  }

  onAccordionClosed(planner: IPlanner) {
    if (planner.id) {
      this.expandedPanels.delete(planner.id);
    }
    
    this.plannerForm.reset();
    this.selectedPlanner = null;
    this.cdr.detectChanges();
  }

  private initializeFormArrays(planner: IPlanner) {
    const fundsArray = this.plannerForm.get('funds') as FormArray;
    const runsArray = this.plannerForm.get('runs') as FormArray;
    const reportsArray = this.plannerForm.get('reports') as FormArray;

    
    fundsArray.clear();
    runsArray.clear();
    reportsArray.clear();

    
    if (planner.funds && Array.isArray(planner.funds)) {
      planner.funds.forEach(fund => {
        fundsArray.push(this.formBuilder.group({
          fund: [fund.fund || ''],
          alias: [fund.alias || '']
        }));
      });
    }

    
    

    if (planner.runs && Array.isArray(planner.runs)) {
      planner.runs.forEach(run => {
        runsArray.push(this.formBuilder.group({
          name: [run.name || ''],
          value: [run.value || '']
        }));
      });
    }

    if (planner.reports && Array.isArray(planner.reports)) {
      planner.reports.forEach(report => {
        reportsArray.push(this.formBuilder.group({
          name: [report.name || ''],
          value: [report.value || '']
        }));
      });
    }
  }

  selectPlanner(planner: IPlanner) {
    if (this.isSelecting || this.selectedPlanner?.id === planner.id) {
      return;
    }

    this.isSelecting = true;
    try {
      this.selectedPlanner = planner;
      this.plannerForm = createPlannerForm(this.formBuilder);
      const selectedPlannerType = this.plannerTypes.find(type => type.value === planner.plannerType);    
      const selectedSystem = this.systems.find(system => system.id === planner.externalSystemConfig?.id);
      
      
      this.plannerForm.patchValue({
        name: planner.name,
        description: planner.description,
        plannerType: selectedPlannerType?.value || '',
        externalSystemConfig: selectedSystem || null,
        sources: planner.sources || [],
        trigger: {
          sources: planner.trigger.sources,
          runs: planner.trigger.runs,
          reports: planner.trigger.reports
        }
      });

      
      this.initializeFormArrays(planner);
    } finally {
      this.isSelecting = false;
    }
  }

  addFund(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    try {
      const funds = this.plannerForm.get('funds') as FormArray;
      if (!funds) {
        console.error('Funds form array not found');
        return;
      }
      
      funds.push(this.formBuilder.group({
        fund: ['', Validators.required],
        alias: ['', Validators.required]
      }));
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error adding fund:', error);
    }
  }


  addRun(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const runs = this.plannerForm.get('runs') as FormArray;
    runs.push(this.formBuilder.group({
      name: [''],
      value: ['']
    }));
  }

  removeRun(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const runs = this.plannerForm.get('runs') as FormArray;
    if (runs.length > 0) {
      runs.removeAt(runs.length - 1);
    }
  }

  addReport(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const reports = this.plannerForm.get('reports') as FormArray;
    reports.push(this.formBuilder.group({
      name: [''],
      value: ['']
    }));
  }

  removeReport(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const reports = this.plannerForm.get('reports') as FormArray;
    if (reports.length > 0) {
      reports.removeAt(reports.length - 1);
    }
  }

  async saveNewPlanner() {
    if (this.plannerForm.valid) {
      try {
        await this.plannerService.createPlanner(this.plannerForm.value);
        await this.loadPlanners();
        this.plannerForm = createPlannerForm(this.formBuilder);
      } catch (error) {
        console.error('Error creating planner:', error);
      }
    }
  }

  async updatePlanner(planner: IPlanner) {
    if (this.plannerForm.valid && planner.documentId) {
      try {
        await this.plannerService.updatePlanner(this.plannerForm.value, planner.documentId.toString());
        await this.loadPlanners();
      } catch (error) {
        console.error('Error updating planner:', error);
      }
    }
  }

  copyPlanner(planner: IPlanner) {
    const plannerData = {
      name: planner.name,
      description: planner.description,
      plannerType: planner.plannerType,
      externalSystemConfig: planner.externalSystemConfig,
      funds: planner.funds,
      trigger: planner.trigger,
      sources: planner.sources,
      runs: planner.runs,
      reports: planner.reports
    };
    
    const jsonString = JSON.stringify(plannerData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      this.snackBar.open('Planner data copied to clipboard', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }).catch(err => {
      this.snackBar.open('Failed to copy planner data', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      console.error('Failed to copy planner data:', err);
    });
  }

  async deletePlanner(planner: IPlanner) {
    if (planner.documentId) {
      try {
        await this.plannerService.deletePlanner(planner.documentId.toString());
        this.snackBar.open('Planner deleted successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.loadPlanners();
        if (this.selectedPlanner?.documentId === planner.documentId) {
          this.selectedPlanner = null;
          this.plannerForm = createPlannerForm(this.formBuilder);
        }
      } catch (error) {
        console.error('Error deleting planner:', error);
        this.snackBar.open('Failed to delete planner. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    }
  }

  async submitPlanner(planner: IPlanner) {
    if (this.plannerForm.valid) {
      try {
        if (planner.id) {
          await this.updatePlanner(planner);
        } else {
          await this.saveNewPlanner();
        }
      } catch (error) {
        console.error('Error submitting planner:', error);
      }
    }
  }
}
