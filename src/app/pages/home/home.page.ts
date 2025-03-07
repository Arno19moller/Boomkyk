import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonRow,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Tree } from 'src/app/models/tree.interface';
import { DatabaseService } from 'src/app/services/database.service';
import { BottomSheetComponent } from '../../components/bottom-sheet/bottom-sheet.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonCardSubtitle,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonCol,
    IonRow,
    IonGrid,
    IonFabList,
    IonFabButton,
    IonFab,
    IonSearchbar,
    IonIcon,
    IonButton,
    IonButtons,
    IonImg,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    RouterModule,
    FormsModule,
    BottomSheetComponent,
  ],
})
export class HomePage implements OnInit {
  protected databaseService = inject(DatabaseService);
  protected isOpen = signal<boolean>(false);
  protected items = signal<Tree[][]>([]);

  constructor() {}

  ngOnInit() {
    this.databaseService.getTrees().then((trees) => {
      const treeList: Tree[][] = [];
      for (let i = 0; i < trees.length; i += 2) {
        if (i + 1 < trees.length) {
          treeList.push([trees[i], trees[i + 1]]);
        } else {
          treeList.push([trees[i]]);
        }
      }
      this.items.set(treeList);
    });
  }

  async filterGroups(filterString: any): Promise<void> {
    // if (filterString) {
    //   filterString = filterString.toLowerCase();
    //   this.groups = (await this.databaseService.getTreesByType(TreeType.Family)).filter((x) =>
    //     x.title.toLowerCase().includes(filterString),
    //   );
    // } else {
    //   this.groups = await this.databaseService.getTreesByType(TreeType.Family);
    // }
  }
}
