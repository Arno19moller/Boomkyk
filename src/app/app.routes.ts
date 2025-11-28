import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/create/create.page').then((m) => m.CreatePage),
  },
  {
    path: 'view',
    loadComponent: () => import('./pages/view/view.page').then((m) => m.ViewPage),
  },
  {
    path: 'level',
    loadComponent: () => import('./pages/level/level.page').then((m) => m.LevelPage),
  },
  {
    path: 'merge',
    loadComponent: () => import('./pages/merge/merge.page').then((m) => m.MergePage),
  },
  {
    path: 'categories',
    loadComponent: () => import('./pages/category/category.page').then((m) => m.CategoryPage),
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
