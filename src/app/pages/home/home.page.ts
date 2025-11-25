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
import { Guid } from 'guid-typescript';
import { CategoryFilter } from 'src/app/models/category-filter.interface';
import { Tree } from 'src/app/models/legacy/tree.interface';
import { NewCategory, NewCategoryItem } from 'src/app/models/new-category.interface';
import { ItemsService } from 'src/app/services/items.service';
import { DatabaseService } from 'src/app/services/legacy/database.service';
import { NewCategoryService } from 'src/app/services/new-category.service';
import { NewImageService } from 'src/app/services/new-image.service';
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
  private categoryService = inject(NewCategoryService);
  private itemsService = inject(ItemsService);
  private imageService = inject(NewImageService);

  protected databaseService = inject(DatabaseService);
  protected isOpen = signal<boolean>(false);
  protected trees = signal<Tree[][]>([]);
  protected categories = signal<NewCategory[]>([]);
  protected filters = signal<CategoryFilter[]>([]);

  protected items = signal<NewCategoryItem[]>([]);

  protected filteredStructures: Signal<any> = computed(() => {
    const filters = this.filters();
    if (filters?.length > 0) {
      // alert(filters[0].level);
    }
  });

  constructor() {}

  ngOnInit() {
    this.itemsService.getItems().then((items) => {
      this.items.set(items);
      this.items.update((items) => {
        items.forEach(async (item) => {
          const images = await this.imageService.getImagesByGuids([item.highlightImageId ?? Guid.create()]);
          item.highlightImage = images?.length > 0 ? images[0] : undefined;
        });
        return items;
      });
    });
    this.databaseService.getTrees().then((trees) => {
      const treeList: Tree[][] = [];
      for (let i = 0; i < trees.length; i += 2) {
        if (i + 1 < trees.length) {
          treeList.push([trees[i], trees[i + 1]]);
        } else {
          treeList.push([trees[i]]);
        }
      }
      this.trees.set(treeList);
    });

    this.categoryService.getCategoryItems().then((categories) => {
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
