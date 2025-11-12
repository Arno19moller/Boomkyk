import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { MapComponent } from 'src/app/components/map/map.component';
import { CategoryStructure, CategoryStructureItem } from 'src/app/models/category-structure.interface';
import { VoiceNote } from 'src/app/models/voice-notes.interface';
import { CategoryService } from 'src/app/services-new/category.service';
import { RecordingService } from 'src/app/services/recording.service';
import { PhotoActionSheetComponent } from '../../../components/action-sheet/action-sheet.component';
import { ItemImageComponent } from '../../../components/create/item-image/item-image.component';
import { SelectItemComponent } from '../../../components/create/select-item/select-item.component';
import { VoiceComponent } from '../../../components/create/voice/voice.component';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonModal,
    CommonModule,
    FormsModule,
    PhotoActionSheetComponent,
    SelectItemComponent,
    ItemImageComponent,
    VoiceComponent,
    MapComponent,
  ],
})
export class CreatePage implements OnInit {
  private categoryService = inject(CategoryService);
  protected recordingService = inject(RecordingService);

  isEdit: boolean = false;
  showMapModal: boolean = false;
  voiceDuration: number = 0;
  categories: CategoryStructure[] = [];
  actionSheetType: 'upload' | 'delete' = 'upload';

  isActionSheetOpen = signal<boolean>(false);
  selectedCategory = signal<CategoryStructure | undefined>(undefined);
  selectedCategoryItem = signal<CategoryStructureItem | undefined>(undefined);
  images = signal<{ format: string; webPath: string; isHighlight: boolean }[]>([]);
  selectedImage = signal<{ format: string; webPath: string; isHighlight: boolean } | undefined>(undefined);

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

  actionSheetClosed(event: any): void {
    if (event === 'gallery') {
      this.addPhotosFromGallery();
    } else if (event === 'camera') {
      this.addPhotosFromCamera();
    } else if (event === 'delete' && this.selectedImage) {
      const index = this.images().indexOf(this.selectedImage()!);
      this.images.update((images) => {
        images.splice(index, 1);
        return images;
      });
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
      this.images.update((imags) => {
        const formattedImgs = images.photos.map((photo) => {
          return {
            format: photo.format,
            webPath: photo.webPath!,
            isHighlight: false,
          };
        });
        imags = [...formattedImgs, ...imags];
        return imags;
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
      this.images.update((images) => {
        images.push({
          format: image.format,
          webPath: image.webPath!,
          isHighlight: false,
        });
        return images;
      });
    }
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

  mapModalClosed(save: boolean) {
    this.showMapModal = false;
  }
  onSubmit(): void {}
}
