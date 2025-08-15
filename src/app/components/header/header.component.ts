import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() createButtonText = 'CREATE NEW EXTERNAL SYSTEM SET-UP';
  @Input() showCreateButton = true;
  @Output() searchChange = new EventEmitter<string>();
  @Output() onCreate = new EventEmitter<void>();

  searchControl = new FormControl('');

  constructor() {
    this.searchControl.valueChanges.subscribe(value => {
      this.searchChange.emit(value || '');
    });
  }
}
