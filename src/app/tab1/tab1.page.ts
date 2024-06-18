import { Component } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Tree } from '../models/tree.interface';
import { TreeGroupsComponent } from './tree-groups/tree-groups.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    TreeGroupsComponent,
    IonSearchbar,
  ],
})
export class Tab1Page {
  public groups: Tree[] = [];

  constructor() {}
}
