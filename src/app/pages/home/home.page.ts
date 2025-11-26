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
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { Guid } from 'guid-typescript';
import { ActionSheetComponent } from 'src/app/components/action-sheet/action-sheet.component';
import { PopupComponent } from 'src/app/components/popup/popup.component';
import { LongPressDirective } from 'src/app/directives/long-press.directive';
import { CategoryFilter } from 'src/app/models/category-filter.interface';
import { Tree } from 'src/app/models/legacy/tree.interface';
import { NewCategory, NewCategoryItem } from 'src/app/models/new-category.interface';
import { ItemsService } from 'src/app/services/items.service';
import { DatabaseService } from 'src/app/services/legacy/database.service';
import { MapService } from 'src/app/services/map.service';
import { NewAudioService } from 'src/app/services/new-audio.service';
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
    ActionSheetComponent,
    PopupComponent,
    LongPressDirective,
  ],
})
export class HomePage implements OnInit, ViewWillEnter {
  private itemsService = inject(ItemsService);
  private mapService = inject(MapService);
  private audioService = inject(NewAudioService);
  private categoryService = inject(NewCategoryService);
  private imageService = inject(NewImageService);

  protected databaseService = inject(DatabaseService);
  protected isOpen = signal<boolean>(false);
  protected trees = signal<Tree[][]>([]);
  protected categories = signal<NewCategory[]>([]);
  protected filters = signal<CategoryFilter[]>([]);
  protected items = signal<NewCategoryItem[]>([]);

  protected actionSheetType: 'action' = 'action';
  protected isActionSheetOpen = signal<boolean>(false);
  protected openConfirmDelete = signal<boolean>(false);
  protected confirmDeleteBody: string = '';
  protected selectedItem = signal<NewCategoryItem | undefined>(undefined);

  protected filteredStructures: Signal<any> = computed(() => {
    const filters = this.filters();
    if (filters?.length > 0) {
      // alert(filters[0].level);
    }
  });

  constructor() {}

  ngOnInit() {
    // this.databaseService.getTrees().then((trees) => {
    //   const treeList: Tree[][] = [];
    //   for (let i = 0; i < trees.length; i += 2) {
    //     if (i + 1 < trees.length) {
    //       treeList.push([trees[i], trees[i + 1]]);
    //     } else {
    //       treeList.push([trees[i]]);
    //     }
    //   }
    //   this.trees.set(treeList);
    // });
    // this.categoryService.getCategoryItems().then((categories) => {});
  }

  ionViewWillEnter() {
    this.getItems();
  }

  async getItems() {
    this.itemsService.getItems().then((items) => {
      this.items.set(items);
      this.items.update((items) => {
        items.forEach(async (item) => {
          const images = await this.imageService.getImagesByGuids([item.highlightImageId ?? Guid.create()]);
          item.highlightImage = images?.length > 0 ? images[0] : undefined;
          await this.setHierarchy(item);
        });
        return items;
      });
    });
  }

  private async setHierarchy(item: NewCategoryItem | undefined) {
    if (item == undefined) return;

    var hierarchy = await this.categoryService.getHierarchy(item);
    item.categoryHierarchy = hierarchy;
  }

  openActionSheet(item: NewCategoryItem) {
    this.selectedItem.set(item);
    this.isActionSheetOpen.set(true);
  }

  actionSheetClosed(event: any): void {
    if (event === 'delete' && this.selectedItem()) {
      this.confirmDeleteBody = `Are you sure you want to delete ${this.selectedItem()?.name}?`;
      this.openConfirmDelete.set(true);
    } else if (event === 'edit' && this.selectedItem()) {
      alert();
    }
  }

  deletePopupClosed(event: string): void {
    if (event === 'confirm') {
      this.deleteItem();
    }
  }

  private async deleteItem() {
    if (this.selectedItem() == undefined) return;

    this.selectedItem()?.pinIds?.forEach(async (pinId) => {
      await this.mapService.removePin(pinId);
    });
    this.selectedItem()?.audioFileIds?.forEach(async (audioFileId) => {
      await this.audioService.removeAudioFile(audioFileId);
    });
    this.selectedItem()?.imageIds?.forEach(async (imageId) => {
      await this.imageService.removeImage(imageId);
    });
    await this.itemsService.removeItem(this.selectedItem()!);

    this.items.update((items) => {
      return items.filter((item) => item.id !== this.selectedItem()?.id);
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
