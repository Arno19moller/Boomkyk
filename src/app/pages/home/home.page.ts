import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
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
import { CategoryFilter } from 'src/app/models/legacy/category-filter.interface';
import { CategoryStructure } from 'src/app/models/legacy/category-structure.interface';
import { Tree } from 'src/app/models/legacy/tree.interface';
import { CategoryService } from 'src/app/services-new/category.service';
import { DatabaseService } from 'src/app/services/database.service';
import { BottomSheetComponent } from '../../components/filter-bottom-sheet/bottom-sheet.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
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
  private categoryService = inject(CategoryService);

  protected databaseService = inject(DatabaseService);
  protected isOpen = signal<boolean>(false);
  protected items = signal<Tree[][]>([]);
  protected categories = signal<CategoryStructure[]>([]);
  protected filters = signal<CategoryFilter[]>([]);

  protected filteredStructures: Signal<any> = computed(() => {
    const filters = this.filters();
    if (filters?.length > 0) {
      // alert(filters[0].level);
    }
  });

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

    this.categoryService.getCategories().then((categories) => {
      this.categories.update(() => categories ?? []);
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
