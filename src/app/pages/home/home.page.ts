import { CommonModule } from '@angular/common';
import { Component, computed, inject, Signal, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AlertController, Platform } from '@ionic/angular';
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
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
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
import { CategoryStructure } from 'src/app/models/category-structure.interface';
import { Tree } from 'src/app/models/legacy/tree.interface';
import { NewCategory, NewCategoryItem } from 'src/app/models/new-category.interface';
import { ItemsService } from 'src/app/services/items.service';
import { DatabaseService } from 'src/app/services/legacy/database.service';
import { MapService } from 'src/app/services/map.service';
import { MigrationService } from 'src/app/services/migration.service';
import { NewAudioService } from 'src/app/services/new-audio.service';
import { NewCategoryService } from 'src/app/services/new-category.service';
import { NewImageService } from 'src/app/services/new-image.service';
import { FilterBottomSheetComponent } from '../../components/filter-bottom-sheet/filter-bottom-sheet.component';

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
    FilterBottomSheetComponent,
    ActionSheetComponent,
    PopupComponent,
    LongPressDirective,
    IonMenu,
    IonMenuButton,
    IonMenuToggle,
  ],
})
export class HomePage implements ViewWillEnter {
  private itemsService = inject(ItemsService);
  private mapService = inject(MapService);
  private audioService = inject(NewAudioService);
  private categoryService = inject(NewCategoryService);
  private imageService = inject(NewImageService);
  private migrationService = inject(MigrationService);
  private router = inject(Router);
  private platform = inject(Platform);
  private alertController = inject(AlertController);
  @ViewChild(IonMenu) menu!: IonMenu;

  protected databaseService = inject(DatabaseService);
  protected isOpen = signal<boolean>(false);
  protected trees = signal<Tree[][]>([]);
  protected categories = signal<CategoryStructure[]>([]);
  protected filters = signal<CategoryFilter[]>([]);
  protected allItems = signal<NewCategoryItem[]>([]);
  protected searchQuery = signal<string>('');
  protected items = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filters = this.filters();
    let items = this.allItems();

    // Filter by search query
    if (query) {
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }

    // Filter by category
    if (filters.length > 0) {
      items = items.filter((item) => {
        return filters.every((filter) => {
          return item.name === filter.value || item.categoryHierarchy?.includes(filter.value);
        });
      });
    }

    return items;
  });

  protected actionSheetType: 'action' = 'action';
  protected isActionSheetOpen = signal<boolean>(false);
  protected openConfirmDelete = signal<boolean>(false);
  protected confirmDeleteBody: string = '';
  protected selectedItem = signal<NewCategoryItem | undefined>(undefined);
  protected placeholderImage: string = 'assets/images/image-not-found.jpg';
  protected hasPageLoaded: boolean = false;

  protected filteredStructures: Signal<any> = computed(() => {
    const filters = this.filters();
    if (filters?.length > 0) {
      // alert(filters[0].level);
    }
  });

  constructor() {}

  async ionViewWillEnter() {
    if (!this.hasPageLoaded) await this.loadPage();

    await this.getItems();
  }

  async loadPage() {
    const categories = await this.categoryService.getCategories();
    const categoryItems = await this.categoryService.getCategoryItems();
    this.buildCategoryStructures(categories, categoryItems);

    this.platform.backButton.subscribeWithPriority(10, async () => {
      const alert = await this.alertController.create({
        header: 'Exit App?',
        message: 'Do you want to exit the application?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Exit cancelled');
            },
          },
          {
            text: 'Exit',
            handler: () => {
              (navigator as any)['app'].exitApp(); // For exiting the app on Cordova/Capacitor
            },
          },
        ],
      });
      await alert.present();
    });

    this.hasPageLoaded = true;
  }

  async getItems() {
    let items = await this.itemsService.getItems();    

    items = items.filter((item) => item.level === 0);

    this.allItems.set(items);
    this.allItems.update((items) => {
      items.forEach(async (item) => {
        const images = await this.imageService.getImagesByGuids([item.highlightImageId ?? Guid.create()]);
        item.highlightImage = images?.length > 0 ? images[0] : undefined;
        await this.setHierarchy(item);
      });
      return items;
    });
  }

  private async setHierarchy(item: NewCategoryItem | undefined) {
    if (item == undefined) return;

    var hierarchy = await this.categoryService.getHierarchy(item);
    item.categoryHierarchy = hierarchy;
  }

  handleImageError(event: any) {
    event.target.src = this.placeholderImage;
  }

  menuButtonClicked(type: string) {
    this.router.navigate([`/${type}`]);
    this.menu.close();
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
      this.router.navigate(['/create'], {
        queryParams: {
          id: this.selectedItem()?.id.toString(),
        },
      });
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

    this.allItems.update((items) => {
      return items.filter((item) => item.id !== this.selectedItem()?.id);
    });
  }

  async filterGroups(filterString: any): Promise<void> {
    this.searchQuery.set(filterString);
  }

  private buildCategoryStructures(categories: NewCategory[], items: NewCategoryItem[]) {
    const structures: CategoryStructure[] = categories.map((category) => {
      return {
        ...category,
        values: items.filter((item) => item.newCategoryId?.toString() === category.id.toString()),
      };
    });
    this.categories.set(structures);
  }

  async migrateData() {
    await this.migrationService.migrate();
    await this.getItems(); // Refresh items after migration
  }
}
