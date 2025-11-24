import { Component, input, model, OnInit, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonButton, IonCard, IonIcon, IonImg, IonItem, IonList, IonTextarea } from '@ionic/angular/standalone';
import { PhotoActionSheetComponent } from 'src/app/components/action-sheet/action-sheet.component';
import { PopupComponent } from 'src/app/components/popup/popup.component';
import { LongPressDirective } from 'src/app/directives/long-press.directive';
import { CategoryStructureItem } from 'src/app/models/category-structure.interface';

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
  ],
})
export class ItemImageComponent implements OnInit {
  selectedCategoryItem = input.required<CategoryStructureItem | undefined>();
  images = model.required<{ format: string; webPath: string; isHighlight: boolean }[]>();

  protected actionSheetType: 'action' | 'upload' | 'delete' = 'upload';
  protected isActionSheetOpen = signal<boolean>(false);
  protected selectedImage = signal<{ format: string; webPath: string; isHighlight: boolean } | undefined>(undefined);
  protected openConfirmDelete = signal<boolean>(false);
  protected confirmDeleteBody: string = '';

  constructor() {}

  ngOnInit() {}

  startLongPress(image: { format: string; webPath: string; isHighlight: boolean }) {
    this.actionSheetType = 'delete';
    this.selectedImage.set(image);
    this.isActionSheetOpen.set(true);
  }

  doubleClick(image: { format: string; webPath: string; isHighlight: boolean }): void {
    this.images.update((images) => {
      images.map((image) => (image.isHighlight = false));
      return images;
    });
    image.isHighlight = true;
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
}
