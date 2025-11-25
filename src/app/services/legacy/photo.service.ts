import { inject, Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, GalleryPhoto, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Platform } from '@ionic/angular';
import { Guid } from 'guid-typescript';
import { ImageType } from '../../models/legacy/image-type.enum';
import { BoomkykPhoto } from '../../models/legacy/photo.interface';
import { Tree } from '../../models/legacy/tree.interface';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private databaseService = inject(DatabaseService);
  private devicePlatform: Platform;

  public storedPhotos: BoomkykPhoto[] = [];

  constructor(platform: Platform) {
    this.devicePlatform = platform;
  }

  public async addMultipleImages(type: ImageType): Promise<void> {
    const images = await Camera.pickImages({
      quality: 60,
      limit: 10,
    }).catch(() => {
      return;
    });

    if (images && images?.photos?.length > 0) {
      this.databaseService.startLoading('Saving Images');
      await Promise.all(
        images.photos.map(async (image) => {
          const savedImageFile = await this.savePicture(image, type);
          this.storedPhotos.push(savedImageFile);
        }),
      );
      this.databaseService.stopLoading();
    }
  }

  public async addSingleImage(type: ImageType): Promise<void> {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 60,
    }).catch(() => {
      return;
    });

    if (capturedPhoto) {
      this.databaseService.startLoading('Saving Image');
      const savedImageFile = await this.savePicture(capturedPhoto, type);
      this.storedPhotos.push(savedImageFile);
      this.databaseService.stopLoading();
    }
  }

  private async savePicture(photo: Photo | GalleryPhoto, type?: ImageType): Promise<BoomkykPhoto> {
    const base64Data = await this.readAsBase64(photo);

    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.devicePlatform.is('hybrid')) {
      return {
        id: Guid.create(),
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        type: type ?? ImageType.Overview,
        timestamp: new Date(),
      };
    } else {
      return {
        id: Guid.create(),
        filepath: fileName,
        webviewPath: photo.webPath,
        type: type ?? ImageType.Overview,
        timestamp: new Date(),
      };
    }
  }

  private async readAsBase64(photo: Photo | GalleryPhoto) {
    // Mobile
    if (this.devicePlatform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!,
      });

      return file.data;
    }
    // Web
    else {
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();

      return (await this.convertBlobToBase64(blob)) as string;
    }
  }

  private convertBlobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  }

  public async deletePicture(photo: BoomkykPhoto) {
    this.databaseService.startLoading('Deleting Image');

    const position = this.storedPhotos.findIndex((x) => x.id === photo.id);
    this.storedPhotos.splice(position, 1);

    // delete photo file from filesystem
    const filename = photo.filepath.substring(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });

    this.databaseService.stopLoading();
  }

  setTreeImages(images: BoomkykPhoto[]) {
    this.storedPhotos = images;
  }

  saveTreeImages(tree: Tree) {
    tree.images = this.storedPhotos;
    this.storedPhotos = [];
  }

  async clearImageList() {
    this.storedPhotos.map(async (image) => {
      await this.deletePicture(image);
    });
  }
}
