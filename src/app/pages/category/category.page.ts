import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Guid } from 'guid-typescript';
import { addIcons } from 'ionicons';
import { add, close, create, trash } from 'ionicons/icons';
import { ActionSheetComponent } from 'src/app/components/action-sheet/action-sheet.component';
import { PopupComponent } from 'src/app/components/popup/popup.component';
import { LongPressDirective } from 'src/app/directives/long-press.directive';
import { NewCategory } from 'src/app/models/new-category.interface';
import { NewCategoryService } from 'src/app/services/new-category.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
  standalone: true,
  imports: [
    IonCard,
    IonBackButton,
    IonButtons,
    IonChip,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonList,
    IonItem,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton,
    IonIcon,
    IonModal,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonInput,
    PopupComponent,
    ActionSheetComponent,
    LongPressDirective,
  ],
})
export class CategoryPage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal;

  categories: NewCategory[] = [];

  // Form State
  isModalOpen = false;
  isEditing = false;
  currentCategory: Partial<NewCategory> = {};

  // Helper for parent selection
  availableParents: NewCategory[] = [];

  // Delete confirmation
  protected openConfirmDelete = signal<boolean>(false);
  protected confirmDeleteBody: string = '';
  protected selectedCategory: NewCategory | undefined = undefined;

  // Action sheet
  protected actionSheetType: 'action' = 'action';
  protected isActionSheetOpen = signal<boolean>(false);

  constructor(
    private newCategoryService: NewCategoryService,
    private alertController: AlertController,
  ) {
    addIcons({ add, trash, create, close });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.categories = await this.newCategoryService.getCategoryItems();
  }

  getParentName(parentId: Guid | undefined): string {
    if (!parentId) return 'None';
    const parent = this.categories.find((c) => c.id.toString() === parentId.toString());
    return parent ? parent.name : 'None';
  }

  openActionSheet(category: NewCategory) {
    this.selectedCategory = category;
    this.isActionSheetOpen.set(true);
  }

  actionSheetClosed(event: any): void {
    if (event === 'edit' && this.selectedCategory) {
      this.openEditModal(this.selectedCategory);
    } else if (event === 'delete' && this.selectedCategory) {
      this.promptDeleteCategory(this.selectedCategory);
    }
  }

  openAddModal() {
    this.isEditing = false;
    this.currentCategory = {
      id: Guid.create(),
      name: '',
      level: 0,
    };
    this.updateAvailableParents();
    this.isModalOpen = true;
  }

  openEditModal(category: NewCategory) {
    this.isEditing = true;
    this.currentCategory = { ...category };
    this.updateAvailableParents();
    this.isModalOpen = true;
  }

  cancel() {
    this.isModalOpen = false;
    this.modal.dismiss(null, 'cancel');
  }

  async confirm() {
    if (!this.currentCategory.name || this.currentCategory.level === undefined) {
      return; // Basic validation
    }

    const categoryToSave: NewCategory = {
      id: this.currentCategory.id || Guid.create(),
      name: this.currentCategory.name,
      level: this.currentCategory.level,
      parentId: this.currentCategory.parentId,
      createDate: this.currentCategory.createDate || new Date(),
    };

    await this.newCategoryService.saveCategoryItem(categoryToSave);
    await this.loadData();
    this.isModalOpen = false;
    this.modal.dismiss(null, 'confirm');
  }

  async promptDeleteCategory(category: NewCategory) {
    this.selectedCategory = category;
    this.confirmDeleteBody = `Are you sure you want to delete ${category.name}?`;
    this.openConfirmDelete.set(true);
  }

  deletePopupClosed(event: string): void {
    if (event === 'confirm') {
      this.deleteCategory();
    }
  }

  async deleteCategory() {
    if (!this.selectedCategory) return;

    const canDelete = true; //await this.newCategoryService.canDeleteCategoryItem(this.selectedCategory.id);

    if (!canDelete) {
      const alert = await this.alertController.create({
        header: 'Cannot Delete',
        message: 'This category or its sub-categories have linked items. Please remove the items first.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    await this.newCategoryService.deleteCategoryItem(this.selectedCategory.id);
    await this.loadData();
    this.selectedCategory = undefined;
  }

  updateAvailableParents() {
    if (this.currentCategory.level === undefined) {
      this.availableParents = [];
      return;
    }

    const targetParentLevel = this.currentCategory.level + 1;
    this.availableParents = this.categories.filter((c) => c.level === targetParentLevel);
  }

  onLevelChange() {
    this.currentCategory.parentId = undefined; // Reset parent if level changes
    this.updateAvailableParents();
  }

  // Helper for template to compare Guids
  compareWith(o1: any, o2: any) {
    if (!o1 || !o2) return o1 === o2;
    if (o1 instanceof Guid && o2 instanceof Guid) return o1.equals(o2);
    if (o1.value && o2.value) return o1.value === o2.value;
    return o1.toString() === o2.toString();
  }
}
