import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonModal,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { MapComponent } from 'src/app/components/map/map.component';
import { PopupComponent } from 'src/app/components/popup/popup.component';
import { LongPressDirective } from 'src/app/directives/long-press.directive';
import { CategoryStructure, CategoryStructureItem } from 'src/app/models/category-structure.interface';
import { Level } from 'src/app/models/level.interface';
import { Pin } from 'src/app/models/pin.interface';
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
    IonCol,
    IonRow,
    IonGrid,
    IonCard,
    IonCardHeader,
    IonCardContent,
    PopupComponent,
    ReactiveFormsModule,
    LongPressDirective,
  ],
})
export class CreatePage implements OnInit {
  private categoryService = inject(CategoryService);
  protected recordingService = inject(RecordingService);

  isEdit: boolean = false;
  showMapModal: boolean = false;
  confirmDeleteBody: string = '';
  voiceDuration: number = 0;
  categories: CategoryStructure[] = [];
  actionSheetType: 'action' | 'upload' | 'delete' = 'upload';

  openConfirmDelete = signal<boolean>(false);
  isActionSheetOpen = signal<boolean>(false);
  selectedCategory = signal<CategoryStructure | undefined>(undefined);
  selectedCategoryItem = signal<CategoryStructureItem | undefined>(undefined);
  images = signal<{ format: string; webPath: string; isHighlight: boolean }[]>([]);
  selectedImage = signal<{ format: string; webPath: string; isHighlight: boolean } | undefined>(undefined);
  mapPins = signal<Pin[]>([]);
  selectedPin: Pin | undefined = undefined;

  itemFormGroup = new FormGroup({
    type: new FormControl<Level | undefined>(undefined, [Validators.required]),
    typeValue: new FormControl('', [Validators.required]),
    newTypeValue: new FormControl(''),
    parent: new FormControl<Level | undefined>(undefined, [Validators.required]),
  });

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
    } else if (event === 'delete' && this.selectedImage()) {
      const index = this.images().indexOf(this.selectedImage()!);
      this.images.update((images) => {
        images.splice(index, 1);
        return images;
      });
    } else if (event === 'delete' && this.selectedPin != undefined) {
      this.removePinClicked(this.selectedPin);
    } else if (event === 'edit' && this.selectedPin != undefined) {
      this.pinDoubleClick(this.selectedPin);
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

  mapModalClosed(pins: Pin[]) {
    this.showMapModal = false;
    this.selectedPin = undefined;
    if (pins == undefined) return;

    this.mapPins.update(() => {
      return pins;
    });
  }

  removePinClicked(pin: Pin): void {
    this.selectedPin = pin;
    this.openConfirmDelete.set(true);
    this.confirmDeleteBody = 'Are you sure you want to delete this pin?';
  }

  deletePopupClosed(role: string) {
    if (role === 'confirm') {
      this.mapPins.update((pins) => {
        const index = pins.indexOf(this.selectedPin!);
        if (index >= 0) {
          pins.splice(index);
        }
        return pins;
      });
    }
  }

  pinDoubleClick(pin: Pin) {
    this.selectedPin = pin;
    this.showMapModal = true;
  }

  pinLongPress(pin: Pin) {
    this.selectedPin = pin;
    this.actionSheetType = 'action';
    this.selectedImage.set(undefined);
    this.isActionSheetOpen.set(true);
  }

  onSubmit(): void {
    console.log(this.itemFormGroup.valid);
  }
}
