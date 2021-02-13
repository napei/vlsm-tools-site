import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ipv6VlsmComponent } from './ipv6-vlsm.component';
import { Ipv6StorageService } from './ipv6-storage.service';

import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

export const routes: Routes = [{ path: '', component: Ipv6VlsmComponent }];

@NgModule({
  declarations: [Ipv6VlsmComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, ReactiveFormsModule, FontAwesomeModule],
  providers: [Ipv6StorageService],
})
export class Ipv6VlsmModule {}
