import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-planner-header',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule
  ],
  templateUrl: './planner-header.component.html',
  styleUrls: ['./planner-header.component.scss']
})
export class PlannerHeaderComponent {
  @Input() createButtonText = 'CREATE NEW PLANNER';
  @Output() searchChange = new EventEmitter<string>();
  @Output() onCreate = new EventEmitter<void>();

  searchControl = new FormControl('');

  constructor() {
    this.searchControl.valueChanges.subscribe(value => {
      this.searchChange.emit(value || '');
    });
  }
}
