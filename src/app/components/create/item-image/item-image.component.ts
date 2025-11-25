import { Component, effect, inject, model, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonButton, IonCard, IonIcon, IonImg, IonItem, IonList, IonTextarea } from '@ionic/angular/standalone';
import { Guid } from 'guid-typescript';
import { PhotoActionSheetComponent } from 'src/app/components/action-sheet/action-sheet.component';
import { PopupComponent } from 'src/app/components/popup/popup.component';
import { LongPressDirective } from 'src/app/directives/long-press.directive';
import { NewCategoryItem } from 'src/app/models/new-category.interface';
import { NewImage } from 'src/app/models/new-image.interface';
import { NewImageService } from 'src/app/services/new-image.service';

@Component({
  standalone: true,
  selector: 'app-item-image',
  templateUrl: './item-image.component.html',
  styleUrls: ['./item-image.component.scss'],
  imports: [
    IonTextarea,
    IonImg,
    IonIcon,
    IonButton,
    IonItem,
    IonList,
    IonCard,
    LongPressDirective,
    PhotoActionSheetComponent,
    PopupComponent,
    FormsModule,
  ],
})
export class ItemImageComponent implements OnInit {
  private newImageService = inject(NewImageService);

  selectedCategoryItem = model.required<NewCategoryItem | undefined>();
  images = model.required<NewImage[]>();

  protected actionSheetType: 'action' | 'upload' | 'delete' = 'upload';
  protected isActionSheetOpen = signal<boolean>(false);
  protected selectedImage = signal<NewImage | undefined>(undefined);
  protected openConfirmDelete = signal<boolean>(false);
  protected confirmDeleteBody: string = '';

  constructor() {
    effect(() => {
      this.newImageService.getImagesByGuids(this.selectedCategoryItem()?.imageIds ?? []).then((images) => {
        this.images.set(images);
      });
    });
  }

  ngOnInit() {}

  startLongPress(image: NewImage) {
    this.actionSheetType = 'delete';
    this.selectedImage.set(image);
    this.isActionSheetOpen.set(true);
  }

  doubleClick(image: NewImage): void {
    this.images.update((images) => {
      images.map((image) => (image.isHighlight = false));
      return images;
    });
    image.isHighlight = true;

    if (this.selectedCategoryItem() != undefined) {
      this.selectedCategoryItem.update((item) => {
        item!.highlightImageId = image.id;
        return item;
      });
    }
  }

  actionSheetClosed(event: any): void {
    if (event === 'gallery') {
      this.addPhotosFromGallery();
    } else if (event === 'camera') {
      this.addPhotosFromCamera();
    } else if (event === 'delete' && this.selectedImage()) {
      this.confirmDeleteBody = 'Are you sure you want to delete this image?';
      this.openConfirmDelete.set(true);
    }
  }

  deletePopupClosed(role: string) {
    if (role === 'confirm') {
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
      const formattedImgs = images.photos.map((photo) => {
        return {
          id: Guid.create(),
          format: photo.format,
          webPath: photo.webPath!,
          isHighlight: false,
        };
      });
      this.addImages(formattedImgs);
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
      this.addImages([
        {
          id: Guid.create(),
          format: image.format,
          webPath: image.webPath!,
          isHighlight: false,
        },
      ]);
    }
  }

  private addImages(newImages: NewImage[]) {
    this.images.update((images) => {
      return [...images, ...newImages];
    });
  }
}
