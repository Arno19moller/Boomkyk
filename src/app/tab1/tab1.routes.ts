import { Routes } from '@angular/router';
import { Tab1Page } from './tab1.page';

export const routes: Routes = [
  {
    path: '',
    component: Tab1Page,
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./tree-list/tree-list.component').then(
        (m) => m.TreeListComponent
      ),
  },
  {
    path: 'view',
    loadComponent: () =>
      import('./tree-view/tree-view.component').then(
        (m) => m.TreeViewComponent
      ),
  },
];
