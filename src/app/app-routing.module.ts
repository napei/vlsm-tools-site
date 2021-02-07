import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContainerLayoutComponent } from './shared/layouts/container/container.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'vlsm-v4',
    pathMatch: 'full',
  },
  {
    path: 'vlsm-v4',
    component: ContainerLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/ipv4-vlsm/ipv4-vlsm.module').then((m) => m.Ipv4VlsmModule),
      },
    ],
  },
  {
    path: '404',
    component: ContainerLayoutComponent,
    children: [{ path: '', loadChildren: () => import('./pages/notfound/notfound.module').then((m) => m.NotFoundModule) }],
  },

  { path: '**', redirectTo: '404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
