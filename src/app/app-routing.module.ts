import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContainerLayoutComponent } from './shared/layouts/container/container.component';

const routes: Routes = [
  {
    path: '',
    component: ContainerLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/ipv4-vlsm/ipv4-vlsm.module').then((m) => m.Ipv4VlsmModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
