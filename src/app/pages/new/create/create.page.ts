import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCol,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonList,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { CategoryStructure, CategoryStructureItem } from 'src/app/models/category-structure.interface';
import { VoiceNote } from 'src/app/models/voice-notes.interface';
import { CategoryService } from 'src/app/services-new/category.service';
import { RecordingService } from 'src/app/services/recording.service';
import { PhotoActionSheetComponent } from '../../../components/action-sheet/action-sheet.component';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: true,
  imports: [
    IonCol,
    IonRow,
    IonFooter,
    IonImg,
    IonTextarea,
    IonInput,
    IonItem,
    IonCard,
    IonList,
    IonIcon,
    IonButton,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSelect,
    IonSelectOption,
    CommonModule,
    FormsModule,
    PhotoActionSheetComponent,
  ],
})
export class CreatePage implements OnInit {
  private categoryService = inject(CategoryService);
  protected recordingService = inject(RecordingService);

  isEdit: boolean = false;
  voiceDuration: number = 0;
  categories: CategoryStructure[] = [];
  images: { format: string; webPath: string; isHighlight: boolean }[] = [];
  selectedImage: { format: string; webPath: string; isHighlight: boolean } | undefined = undefined;
  longPressTimeout: any;
  isLongPressing: boolean = false;
  actionSheetType: 'upload' | 'delete' = 'upload';

  isActionSheetOpen = signal<boolean>(false);
  selectedCategory = signal<CategoryStructure | undefined>(undefined);
  selectedCategoryItem = signal<CategoryStructureItem | undefined>(undefined);

  constructor() {}

  ngOnInit() {
    this.categoryService.getCategories().then((categories) => {
      this.categories = [];

      if (categories && categories.length > 0) {
        categories = categories?.sort((a, b) => a.level - b.level);
        this.categories = categories;
        this.selectedCategory.set(categories[0]);
      }
    });
  }

  updateName(event: any): void {
    const newName = event.detail.value;
    this.selectedCategoryItem.update((current) => ({ ...current, name: newName }));
  }

  actionSheetClosed(event: any): void {
    if (event === 'gallery') {
      this.addPhotosFromGallery();
    } else if (event === 'camera') {
      this.addPhotosFromCamera();
    } else if (event === 'delete' && this.selectedImage) {
      const index = this.images.indexOf(this.selectedImage);
      this.images.splice(index, 1);
    }
  }

  private async addPhotosFromGallery(): Promise<void> {
    const images = await Camera.pickImages({
      quality: 60,
      limit: 10,
    }).catch(() => {
      return;
    });

    if (images && images?.photos?.length > 0) {
      this.images = images.photos.map((photo) => {
        return {
          format: photo.format,
          webPath: photo.webPath!,
          isHighlight: false,
        };
      });
    }
  }

  private async addPhotosFromCamera(): Promise<void> {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 60,
    }).catch(() => {
      return;
    });

    if (image) {
      this.images.push({
        format: image.format,
        webPath: image.webPath!,
        isHighlight: false,
      });
    }
  }

  startLongPress(image: { format: string; webPath: string; isHighlight: boolean }) {
    this.isLongPressing = true;
    this.longPressTimeout = setTimeout(() => {
      if (this.isLongPressing) {
        this.actionSheetType = 'delete';
        this.selectedImage = image;
        this.isActionSheetOpen.set(true);
      }
    }, 400);
  }

  endLongPress() {
    this.isLongPressing = false;
    clearTimeout(this.longPressTimeout);
  }

  doubleClick(image: { format: string; webPath: string; isHighlight: boolean }): void {
    this.images.map((image) => (image.isHighlight = false));
    image.isHighlight = true;
  }

  async playNote(note: VoiceNote) {
    if (note.isPlaying) {
      this.recordingService.pausePlayback();
      note.isPlaying = false;
      return;
    }
    await this.recordingService.playFile(note);
  }

  deleteVoiceNoteClicked(): void {
    this.actionSheetType = 'delete';
    this.isActionSheetOpen.set(true);
  }

  onSubmit(): void {}
}
