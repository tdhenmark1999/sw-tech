import { Component, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidemenu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './sidemenu.component.html',
  styleUrl: './sidemenu.component.scss'
})
export class SidemenuComponent implements AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isOpen = true;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  menuItems = [
    { 
      icon: 'settings', 
      label: 'External System', 
      route: '/external' 
    },
    { 
      icon: 'dashboard', 
      label: 'Planner', 
      route: '/planner' 
    },
    { 
      icon: 'storage', 
      label: 'Data Management', 
      route: '/data-management' 
    }
  ];

  ngAfterViewInit() {
    
    setTimeout(() => {
      if (this.sidenav) {
        this.sidenav.open();
      }
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    
    setTimeout(() => {
      if (this.sidenav && this.sidenav._container) {
        this.sidenav._container.updateContentMargins();
        this.cdr.detectChanges();
      }
    }, 50);
  }
}
