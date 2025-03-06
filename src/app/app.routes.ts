import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'family',
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
  {
    path: 'maps',
    loadComponent: () => import('./pages/maps/maps.page').then((m) => m.MapsPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
];
