import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/tree-families/tree-families.component').then((m) => m.TreeFamiliesComponent),
  },
  {
    path: 'list',
    loadComponent: () => import('./pages/tree-list/tree-list.component').then((m) => m.TreeListComponent),
  },
  {
    path: 'view',
    loadComponent: () => import('./pages/tree-view/tree-view.component').then((m) => m.TreeViewComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/create/create.page').then((m) => m.Tab2Page),
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
