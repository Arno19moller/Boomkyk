import { Injectable } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { BoomkykPhoto } from '../models/photo.interface';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { ImageType } from '../models/image-type.enum';
import { Guid } from 'guid-typescript';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  //public photos: BoomkykPhoto[] = [];
  //private PHOTO_STORAGE: string = 'photos';
  private platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  public async addNewToGallery(
    photos: BoomkykPhoto[],
    type?: ImageType
  ): Promise<void> {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });

    const savedImageFile = await this.savePicture(capturedPhoto, type);
    photos.unshift(savedImageFile);

    // Save to device
    // Preferences.set({
    //   key: this.PHOTO_STORAGE,
    //   value: JSON.stringify(photos),
    // });
  }

  private async savePicture(
    photo: Photo,
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

  private async readAsBase64(photo: Photo) {
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

  public async loadSaved(): Promise<BoomkykPhoto[]> {
    // const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    // const photos = (value ? JSON.parse(value) : []) as BoomkykPhoto[];

    // // Only for web
    // if (!this.platform.is('hybrid')) {
    //   for (let photo of photos) {
    //     const readFile = await Filesystem.readFile({
    //       path: photo.filepath,
    //       directory: Directory.Data,
    //     });

    //     photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    //   }
    // }

    // return photos;
    return [];
  }

  public async deletePicture(photos: BoomkykPhoto[], photo: BoomkykPhoto) {
    // Remove this photo from the Photos reference data array
    const position = photos.findIndex((x) => x.id === photo.id);
    photos.splice(position, 1);

    // Update photos array cache by overwriting the existing photo array
    // Preferences.set({
    //   key: this.PHOTO_STORAGE,
    //   value: JSON.stringify(photos),
    // });

    // delete photo file from filesystem
    const filename = photo.filepath.substring(
      photo.filepath.lastIndexOf('/') + 1
    );

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
  }
}
