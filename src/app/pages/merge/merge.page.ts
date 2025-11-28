import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Guid } from 'guid-typescript';
import { addIcons } from 'ionicons';
import { checkmarkCircle, gitMerge } from 'ionicons/icons';
import { AudioRecording } from 'src/app/models/audio-recording.interface';
import { NewCategoryItem } from 'src/app/models/new-category.interface';
import { NewImage } from 'src/app/models/new-image.interface';
import { Pin } from 'src/app/models/pin.interface';
import { ItemsService } from 'src/app/services/items.service';
import { MapService } from 'src/app/services/map.service';
import { NewAudioService } from 'src/app/services/new-audio.service';
import { NewCategoryService } from 'src/app/services/new-category.service';
import { NewImageService } from 'src/app/services/new-image.service';

interface ItemWithContent {
  item: NewCategoryItem;
  images: NewImage[];
  audioFiles: AudioRecording[];
  pins: Pin[];
  selectedImages: Set<string>;
  selectedAudioFiles: Set<string>;
  selectedPins: Set<string>;
  useNotes: boolean;
}

@Component({
  selector: 'app-merge',
  templateUrl: './merge.page.html',
  styleUrls: ['./merge.page.scss'],
  standalone: true,
  imports: [
    IonCheckbox,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonChip,
    IonImg,
    IonList,
    IonItem,
    IonLabel,
    IonSelectOption,
    IonSelect,
    IonInput,
    IonIcon,
    IonButton,
    IonButtons,
    IonBackButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ],
})
export class MergePage implements OnInit {
  // All available items
  allItems: NewCategoryItem[] = [];
  availableParents: NewCategoryItem[] = [];

  // Selected items for merging
  selectedItem1Id: string | undefined;
  selectedItem2Id: string | undefined;

  // Items with their content
  item1: ItemWithContent | null = null;
  item2: ItemWithContent | null = null;

  // Merged item properties
  mergedName: string = '';
  mergedParentId: Guid | undefined;
  mergedNotes: string = '';
  mergedLevel: number = 0;
  mergedCategoryId: Guid | undefined;

  // UI state
  showMergeForm = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  constructor(
    private categoryService: NewCategoryService,
    private itemsService: ItemsService,
    private imageService: NewImageService,
    private audioService: NewAudioService,
    private mapService: MapService,
    private alertController: AlertController,
    private router: Router,
  ) {
    addIcons({ gitMerge, checkmarkCircle });
  }

  async ngOnInit() {
    await this.loadItems();
  }

  async loadItems() {
    this.allItems = await this.itemsService.getItems();
  }

  async onItem1Selected() {
    if (!this.selectedItem1Id) {
      this.item1 = null;
      this.showMergeForm.set(false);
      return;
    }

    const item = this.allItems.find((i) => i.id.toString() === this.selectedItem1Id);
    if (item) {
      this.item1 = await this.loadItemContent(item);
      await this.checkBothItemsSelected();
    }
  }

  async onItem2Selected() {
    if (!this.selectedItem2Id) {
      this.item2 = null;
      this.showMergeForm.set(false);
      return;
    }

    const item = this.allItems.find((i) => i.id.toString() === this.selectedItem2Id);
    if (item) {
      this.item2 = await this.loadItemContent(item);
      await this.checkBothItemsSelected();
    }
  }

  async checkBothItemsSelected() {
    if (this.item1 && this.item2) {
      // Validate that items are different
      if (this.item1.item.id.toString() === this.item2.item.id.toString()) {
        const alert = await this.alertController.create({
          header: 'Invalid Selection',
          message: 'Please select two different items to merge.',
          buttons: ['OK'],
        });
        await alert.present();
        this.selectedItem2Id = undefined;
        this.item2 = null;
        this.showMergeForm.set(false);
        return;
      }

      // Initialize merged item properties
      this.mergedName = this.item1.item.name;
      this.mergedParentId = this.item1.item.parentId;
      this.mergedLevel = this.item1.item.level;
      this.mergedCategoryId = this.item1.item.newCategoryId;
      this.mergedNotes = '';

      // Select all content from item1 by default
      this.item1.selectedImages = new Set(this.item1.images.map((img) => img.id.toString()));
      this.item1.selectedAudioFiles = new Set(this.item1.audioFiles.map((audio) => audio.id.toString()));
      this.item1.selectedPins = new Set(this.item1.pins.map((pin) => pin.id.toString()));
      this.item1.useNotes = !!this.item1.item.notes;

      // Deselect all content from item2 by default
      this.item2.selectedImages = new Set();
      this.item2.selectedAudioFiles = new Set();
      this.item2.selectedPins = new Set();
      this.item2.useNotes = false;

      // Update available parents
      await this.updateAvailableParents();

      this.showMergeForm.set(true);
    } else {
      this.showMergeForm.set(false);
    }
  }

  async loadItemContent(item: NewCategoryItem): Promise<ItemWithContent> {
    const images = await this.imageService.getImagesByGuids(item.imageIds || []);
    const audioFiles = await this.audioService.getAudioFilesByGuid(item.audioFileIds || []);
    const pins = await this.mapService.getPinsByGuid(item.pinIds || []);

    return {
      item,
      images,
      audioFiles,
      pins,
      selectedImages: new Set(),
      selectedAudioFiles: new Set(),
      selectedPins: new Set(),
      useNotes: false,
    };
  }

  toggleImage(itemContent: ItemWithContent, imageId: string) {
    if (itemContent.selectedImages.has(imageId)) {
      itemContent.selectedImages.delete(imageId);
    } else {
      itemContent.selectedImages.add(imageId);
    }
  }

  toggleAudioFile(itemContent: ItemWithContent, audioId: string) {
    if (itemContent.selectedAudioFiles.has(audioId)) {
      itemContent.selectedAudioFiles.delete(audioId);
    } else {
      itemContent.selectedAudioFiles.add(audioId);
    }
  }

  togglePin(itemContent: ItemWithContent, pinId: string) {
    if (itemContent.selectedPins.has(pinId)) {
      itemContent.selectedPins.delete(pinId);
    } else {
      itemContent.selectedPins.add(pinId);
    }
  }

  onNotesToggle(itemContent: ItemWithContent) {
    if (!this.item1 || !this.item2) return;

    // Ensure only one item's notes can be selected at a time
    if (itemContent === this.item1) {
      this.item2.useNotes = false;
    } else {
      this.item1.useNotes = false;
    }
  }

  async updateAvailableParents() {
    const targetParentLevel = this.mergedLevel + 1;
    this.availableParents = this.allItems.filter((c) => c.level === targetParentLevel);
  }

  onLevelChange() {
    this.mergedParentId = undefined;
    this.updateAvailableParents();
  }

  compareWith(o1: any, o2: any) {
    if (!o1 || !o2) return o1 === o2;
    if (o1 instanceof Guid && o2 instanceof Guid) return o1.equals(o2);
    if (o1.value && o2.value) return o1.value === o2.value;
    return o1.toString() === o2.toString();
  }

  async performMerge() {
    if (!this.item1 || !this.item2) return;

    // Validate
    if (!this.mergedName.trim()) {
      const alert = await this.alertController.create({
        header: 'Validation Error',
        message: 'Please enter a name for the merged item.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    this.isLoading.set(true);

    try {
      // Collect selected image IDs
      const selectedImageIds: Guid[] = [];
      this.item1.selectedImages.forEach((id) => selectedImageIds.push(Guid.parse(id)));
      this.item2.selectedImages.forEach((id) => selectedImageIds.push(Guid.parse(id)));

      // Collect selected audio file IDs
      const selectedAudioIds: Guid[] = [];
      this.item1.selectedAudioFiles.forEach((id) => selectedAudioIds.push(Guid.parse(id)));
      this.item2.selectedAudioFiles.forEach((id) => selectedAudioIds.push(Guid.parse(id)));

      // Collect selected pin IDs
      const selectedPinIds: Guid[] = [];
      this.item1.selectedPins.forEach((id) => selectedPinIds.push(Guid.parse(id)));
      this.item2.selectedPins.forEach((id) => selectedPinIds.push(Guid.parse(id)));

      // Determine notes
      let finalNotes = '';
      if (this.item1.useNotes && this.item1.item.notes) {
        finalNotes = this.item1.item.notes;
      } else if (this.item2.useNotes && this.item2.item.notes) {
        finalNotes = this.item2.item.notes;
      }

      // Determine highlight image (prefer from item1 if available)
      let highlightImageId: Guid | undefined;
      if (this.item1.selectedImages.size > 0) {
        highlightImageId = Guid.parse(Array.from(this.item1.selectedImages)[0]);
      } else if (this.item2.selectedImages.size > 0) {
        highlightImageId = Guid.parse(Array.from(this.item2.selectedImages)[0]);
      }

      // Create merged item (keep item1's ID, delete item2)
      const mergedItem: NewCategoryItem = {
        id: this.item1.item.id,
        name: this.mergedName,
        level: this.mergedLevel,
        parentId: this.mergedParentId,
        newCategoryId: this.mergedCategoryId,
        notes: finalNotes,
        imageIds: selectedImageIds,
        audioFileIds: selectedAudioIds,
        pinIds: selectedPinIds,
        highlightImageId: highlightImageId,
        createDate: this.item1.item.createDate,
      };

      // Save merged item
      await this.itemsService.updateItem(mergedItem);

      // Delete item2
      await this.itemsService.removeItem(this.item2.item);

      // Show success message
      const alert = await this.alertController.create({
        header: 'Success',
        message: 'Items merged successfully!',
        buttons: ['OK'],
      });
      await alert.present();

      // Navigate back to home
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error merging items:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'An error occurred while merging items. Please try again.',
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.isLoading.set(false);
    }
  }

  async cancel() {
    this.router.navigate(['/home']);
  }
}
