import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Ipv4VlsmComponent } from './pages/ipv4-vlsm/ipv4-vlsm.component';

const routes: Routes = [{ path: '', component: Ipv4VlsmComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
