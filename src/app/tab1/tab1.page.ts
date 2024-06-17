import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { TreeGroupsComponent } from './tree-groups/tree-groups.component';
import { DatabaseService } from '../services/database.service';
import { Tree } from '../models/tree.interface';

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

  constructor(public databaseService: DatabaseService) {}

  async filterGroups(filterString: any): Promise<void> {
    if (filterString) {
      filterString = filterString.toLowerCase();
      this.groups = (await this.databaseService.getTreeGroups()).filter((x) =>
        x.title.toLowerCase().includes(filterString)
      );
    } else {
      this.groups = await this.databaseService.getTreeGroups();
    }
  }
}
