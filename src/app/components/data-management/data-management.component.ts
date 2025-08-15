import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeaderComponent } from '../header/header.component';
import { DropdownService, DropdownItem } from '../../services/dropdown.service';

interface DataCategory {
  title: string;
  key: string;
  items: DropdownItem[];
  hasType?: boolean;
}

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    HeaderComponent
  ],
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.scss']
})
export class DataManagementComponent implements OnInit {
  formBuilder = inject(FormBuilder);
  snackBar = inject(MatSnackBar);
  dropdownService = inject(DropdownService);
  
  isLoading = false;
  currentSearch = '';
  allCategories: DataCategory[] = [];
  filteredCategories: DataCategory[] = [];
  
  reportTypes = [
    { name: 'Financial Report', value: 'financial' },
    { name: 'Performance Report', value: 'performance' },
    { name: 'Risk Report', value: 'risk' },
    { name: 'Compliance Report', value: 'compliance' }
  ];

  dataCategories: DataCategory[] = [
    {
      title: 'Source Names',
      key: 'sources',
      items: []
    },
    {
      title: 'Run Names',
      key: 'runs', 
      items: []
    },
    {
      title: 'Report Names',
      key: 'reports',
      hasType: true,
      items: []
    },
    {
      title: 'Fund Names',
      key: 'funds',
      items: []
    },
    {
      title: 'Fund Aliases',
      key: 'fundAliases',
      items: []
    }
  ];

  categoryForms: { [key: string]: FormGroup } = {};

  ngOnInit() {
    this.loadAllData();
    this.filteredCategories = [...this.dataCategories];
  }

  private loadAllData(search = '') {
    this.isLoading = true;
    let loadedCount = 0;
    const totalCategories = this.dataCategories.length;

    this.dataCategories.forEach(category => {
      this.dropdownService.getDropdownData(category.key, search).subscribe({
        next: (response) => {
          category.items = response.data || [];
          loadedCount++;
          if (loadedCount === totalCategories) {
            this.initializeForms();
            this.isLoading = false;
            if (!search) {
              this.allCategories = JSON.parse(JSON.stringify(this.dataCategories));
            }
            this.updateFilteredCategories();
          }
        },
        error: (error) => {
          console.error(`Error loading ${category.key}:`, error);
          loadedCount++;
          if (loadedCount === totalCategories) {
            this.initializeForms();
            this.isLoading = false;
            if (!search) {
              this.allCategories = JSON.parse(JSON.stringify(this.dataCategories));
            }
            this.updateFilteredCategories();
          }
        }
      });
    });
  }

  private initializeForms() {
    this.dataCategories.forEach(category => {
      this.categoryForms[category.key] = this.formBuilder.group({
        items: this.formBuilder.array(
          category.items.map(item => this.createItemForm(item, category.hasType))
        )
      });
    });
  }

  private createItemForm(item: DropdownItem, hasType: boolean = false): FormGroup {
    if (hasType) {
      return this.formBuilder.group({
        name: [item.name, Validators.required],
        value: [item.value, Validators.required],
        type: [item.type, Validators.required]
      });
    } else {
      return this.formBuilder.group({
        name: [item.name, Validators.required],
        value: [item.value, Validators.required]
      });
    }
  }

  getItemsArray(categoryKey: string): FormArray {
    return this.categoryForms[categoryKey]?.get('items') as FormArray;
  }

  addItem(category: DataCategory, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const itemsArray = this.getItemsArray(category.key);
    const newItem: DropdownItem = { name: '', value: '', type: category.hasType ? '' : undefined };
    itemsArray.push(this.createItemForm(newItem, category.hasType));
  }

  removeItem(categoryKey: string, index: number, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const itemsArray = this.getItemsArray(categoryKey);
    if (itemsArray.length > 0) {
      itemsArray.removeAt(index);
    }
  }

  saveCategory(category: DataCategory) {
    const form = this.categoryForms[category.key];
    if (form.valid) {
      const items = form.value.items;
      items.sort((a: DropdownItem, b: DropdownItem) => a.name.localeCompare(b.name));
      
      this.dropdownService.saveDropdownData(category.key, items).subscribe({
        next: (response) => {
          category.items = items;
          
          this.snackBar.open(response.message || `${category.title} saved successfully`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        },
        error: (error) => {
          console.error(`Error saving ${category.title}:`, error);
          this.snackBar.open(`Error saving ${category.title}`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    } else {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  onSearch(searchTerm: string) {
    this.currentSearch = searchTerm.toLowerCase();
    this.updateFilteredCategories();
  }

  private updateFilteredCategories() {
    if (!this.currentSearch.trim()) {
      this.filteredCategories = [...this.dataCategories];
    } else {
      this.filteredCategories = this.dataCategories
        .map(category => ({
          ...category,
          items: category.items.filter(item => 
            item.name.toLowerCase().includes(this.currentSearch) ||
            item.value.toLowerCase().includes(this.currentSearch)
          )
        }))
        .filter(category => category.items.length > 0);
    }
  }

  createNewItem() {
  }
}