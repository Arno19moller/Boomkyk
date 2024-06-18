import { Injectable } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  GalleryPhoto,
  Photo,
} from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Platform } from '@ionic/angular';
import { Guid } from 'guid-typescript';
import { ImageType } from '../models/image-type.enum';
import { BoomkykPhoto } from '../models/photo.interface';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private platform: Platform;

  constructor(platform: Platform, private databaseService: DatabaseService) {
    this.platform = platform;
  }

  public async addMultipleImages(
    photos: BoomkykPhoto[],
    type?: ImageType
  ): Promise<void> {
    const images = await Camera.pickImages({
      quality: 100,
      limit: 10,
    }).catch(() => {
      return;
    });

    if (images && images?.photos?.length > 0) {
      this.databaseService.startLoading('Saving Images');
      await Promise.all(
        images.photos.map(async (image) => {
          const savedImageFile = await this.savePicture(image, type);
          photos.unshift(savedImageFile);
        })
      );
      this.databaseService.stopLoading();
    }
  }

  public async addSingleImage(
    photos: BoomkykPhoto[],
    type?: ImageType
  ): Promise<void> {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      allowEditing: true,
      quality: 100,
    }).catch(() => {
      return;
    });

    if (capturedPhoto) {
      this.databaseService.startLoading('Saving Image');
      const savedImageFile = await this.savePicture(capturedPhoto, type);
      photos.unshift(savedImageFile);
      this.databaseService.stopLoading();
    }
  }

  private async savePicture(
    photo: Photo | GalleryPhoto,
    type?: ImageType
  ): Promise<BoomkykPhoto> {
    const base64Data = await this.readAsBase64(photo);

    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid')) {
      return {
        id: Guid.create(),
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        type: type ?? ImageType.Overview,
      };
    } else {
      return {
        id: Guid.create(),
        filepath: fileName,
        webviewPath: photo.webPath,
        type: type ?? ImageType.Overview,
      };
    }
  }

  private async readAsBase64(photo: Photo | GalleryPhoto) {
    // Mobile
    if (this.platform.is('hybrid')) {
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

  public async deletePicture(photos: BoomkykPhoto[], photo: BoomkykPhoto) {
    this.databaseService.startLoading('Deleting Image');

    const position = photos.findIndex((x) => x.id === photo.id);
    photos.splice(position, 1);

    // delete photo file from filesystem
    const filename = photo.filepath.substring(
      photo.filepath.lastIndexOf('/') + 1
    );

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });

    this.databaseService.stopLoading();
  }
}
