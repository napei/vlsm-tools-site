import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ipv4VlsmComponent } from './ipv4-vlsm.component';

import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IPv4StorageService } from './ipv4-storage.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgbAlertModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ClipboardModule } from 'ngx-clipboard';

export const routes: Routes = [{ path: '', component: Ipv4VlsmComponent }];

@NgModule({
  declarations: [Ipv4VlsmComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FontAwesomeModule,
    NgxChartsModule,
    NgbModalModule,
    ClipboardModule,
    NgbAlertModule
  ],
  providers: [IPv4StorageService],
})
export class Ipv4VlsmModule {}
