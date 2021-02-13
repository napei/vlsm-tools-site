import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContainerLayoutComponent } from './shared/layouts/container/container.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'vlsm/v4',
    pathMatch: 'full',
  },
  {
    path: 'vlsm',
    component: ContainerLayoutComponent,
    children: [
      {
        path: 'v4',
        loadChildren: () => import('./pages/ipv4-vlsm/ipv4-vlsm.module').then((m) => m.Ipv4VlsmModule),
      },
      {
        path: 'v6',
        loadChildren: () => import('./pages/ipv6-vlsm/ipv6-vlsm.module').then((m) => m.Ipv6VlsmModule),
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
