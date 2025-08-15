import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { HeaderComponent } from '../header/header.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemService } from '../../services/system.service';
import { HttpClientModule } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { AUTHENTICATION_METHODS } from '../../constants';
import { ISystem, SystemForm } from '../../models/system';
import { CustomValidators } from '../../validators/custom-validators';

interface SystemWithTempId extends ISystem {
  tempId: number;
}

@Component({
  selector: 'app-external-system',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    HeaderComponent,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './external-system.component.html',
  styleUrls: ['./external-system.component.scss']
})
export class ExternalSystemComponent implements OnInit {
  formBuilder = inject(FormBuilder);
  systemForm: FormGroup = this.formBuilder.group(SystemForm);
  authenticationMethods = AUTHENTICATION_METHODS;
  systemService = inject(SystemService);
  private cdr = inject(ChangeDetectorRef);
  isLoading = false;

  systems: SystemWithTempId[] = [];
  filteredSystems: SystemWithTempId[] = [];
  paginatedSystems: SystemWithTempId[] = [];
  systemForms: { [key: number]: FormGroup } = {};
  
  
  pageSize = 5;
  pageIndex = 0;
  totalSystems = 0;
  pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.loadSystems();
  }

  async loadSystems() {
    try {
      this.isLoading = true;
      const response = await this.systemService.getSystems();
      this.systems = response.data.map((system: ISystem) => ({
        ...system,
        tempId: system.id || Date.now()
      }));
      this.filteredSystems = [...this.systems];
      this.updatePagination();
      this.initializeSystemForms();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading systems:', error);
    } finally {
      this.isLoading = false;
    }
  }

  initializeSystemForms() {
    this.systems.forEach(system => {
      this.systemForms[system.tempId] = this.formBuilder.group({
        name: [system.name, [
          Validators.required,
          CustomValidators.minLengthTrimmed(3),
          CustomValidators.alphanumericWithSpaces(),
          CustomValidators.noWhitespace()
        ]],
        baseUrl: [system.baseUrl, [
          Validators.required,
          CustomValidators.url(),
          CustomValidators.noWhitespace()
        ]],
        authenticationMethod: [system.authenticationMethod, Validators.required],
        authenticationPlace: [system.authenticationPlace, Validators.required],
        key: [system.key, [
          Validators.required,
          CustomValidators.apiKey(),
          CustomValidators.minLengthTrimmed(3)
        ]],
        value: [system.value, [
          Validators.required,
          CustomValidators.minLengthTrimmed(3),
          CustomValidators.noWhitespace()
        ]]
      });
    });
  }

  onSearch(searchTerm: string) {
    this.filteredSystems = this.systems.filter(system =>
      system.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.pageIndex = 0; 
    this.updatePagination();
  }

  private updatePagination() {
    this.totalSystems = this.filteredSystems.length;
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedSystems = this.filteredSystems.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  createNewSystem() {
    const tempId = Date.now();
    const newSystem: SystemWithTempId = {
      name: '',
      baseUrl: '',
      authenticationMethod: this.authenticationMethods[0]?.value || '',
      authenticationPlace: 'header',
      key: '',
      value: '',
      tempId: tempId
    };
    
    this.systems.push(newSystem);
    this.filteredSystems = [...this.systems];
    this.updatePagination();
    
    this.systemForms[tempId] = this.formBuilder.group({
      name: ['', [
        Validators.required,
        CustomValidators.minLengthTrimmed(3),
        CustomValidators.alphanumericWithSpaces(),
        CustomValidators.noWhitespace()
      ]],
      baseUrl: ['', [
        Validators.required,
        CustomValidators.url(),
        CustomValidators.noWhitespace()
      ]],
      authenticationMethod: [this.authenticationMethods[0]?.value || '', Validators.required],
      authenticationPlace: ['header', Validators.required],
      key: ['', [
        Validators.required,
        CustomValidators.apiKey(),
        CustomValidators.minLengthTrimmed(3)
      ]],
      value: ['', [
        Validators.required,
        CustomValidators.minLengthTrimmed(3),
        CustomValidators.noWhitespace()
      ]]
    });
    
    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }

  async saveNewSystem(tempId: number) {
    const form = this.systemForms[tempId];
    if (form && form.valid) {
      try {
        const newSystem = form.value;
        await this.systemService.createSystem(newSystem);
        this.snackBar.open('System created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        await this.loadSystems();
        delete this.systemForms[tempId];
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error creating system:', error);
        this.snackBar.open('Failed to create system. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    } else {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  async updateSystem(tempId: number) {
    const form = this.systemForms[tempId];
    if (form && form.valid) {
      try {
        const system = this.systems.find(s => s.tempId === tempId);
        if (system?.id) {
          const updatedSystem = { ...form.value };
          await this.systemService.updateSystem(updatedSystem, system?.documentId?.toString() || '');
          this.snackBar.open('System updated successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          await this.loadSystems();
          this.cdr.detectChanges();
        }
      } catch (error) {
        console.error('Error updating system:', error);
        this.snackBar.open('Failed to update system. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    } else {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  copySystem(system: SystemWithTempId) {
    const systemData = {
      name: system.name,
      baseUrl: system.baseUrl,
      authenticationMethod: system.authenticationMethod,
      authenticationPlace: system.authenticationPlace,
      key: system.key,
      value: system.value
    };
    
    const jsonString = JSON.stringify(systemData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      this.snackBar.open('System data copied to clipboard', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }).catch(err => {
      this.snackBar.open('Failed to copy system data', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      console.error('Failed to copy system data:', err);
    });
  }

  async deleteSystem(system: SystemWithTempId) {
    try {
      await this.systemService.deleteSystem(system.documentId?.toString() || '');
      this.snackBar.open('System deleted successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      await this.loadSystems();
    } catch (error) {
      console.error('Error deleting system:', error);
      this.snackBar.open('Failed to delete system. Please try again.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }
  
  getFieldError(tempId: number, fieldName: string): string {
    const form = this.systemForms[tempId];
    if (!form) return '';
    
    const control = form.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';
    
    const errors = control.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['minLengthTrimmed']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['minLengthTrimmed'].requiredLength} characters`;
    if (errors['url']) return errors['url'].message;
    if (errors['alphanumeric']) return errors['alphanumeric'].message;
    if (errors['apiKey']) return errors['apiKey'].message;
    if (errors['whitespace']) return errors['whitespace'].message;
    
    return '';
  }
  
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Name',
      baseUrl: 'Base URL',
      authenticationMethod: 'Authentication Method',
      authenticationPlace: 'Authentication Place',
      key: 'Key',
      value: 'Value'
    };
    return labels[fieldName] || fieldName;
  }
  
  isFieldInvalid(tempId: number, fieldName: string): boolean {
    const form = this.systemForms[tempId];
    if (!form) return false;
    
    const control = form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
