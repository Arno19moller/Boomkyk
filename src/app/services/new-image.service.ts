import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Guid } from 'guid-typescript';
import { NewImage } from '../models/new-image.interface';

@Injectable({
  providedIn: 'root',
})
export class NewImageService {
  private _storage: Storage | null = null;
  private readonly IMAGE_PREFIX = 'image_';

  constructor(private storage: Storage) {
    this.initialiseStorage();
  }

  async initialiseStorage(): Promise<void> {
    if (this._storage == null) {
      const storage = await this.storage.create();
      this._storage = storage;
    }
  }

  async getImagesByGuids(guids: Guid[]): Promise<NewImage[]> {
    await this.initialiseStorage();
    const images: NewImage[] = [];
    for (const guid of guids) {
      const guidString = typeof guid === 'string' ? guid : (guid as any).value || guid.toString();
      const img = await this._storage?.get(this.IMAGE_PREFIX + guidString);
      if (img) {
        images.push(this.deserializeImage(img));
      }
    }
    return images;
  }

  async setImages(images: NewImage[]) {
    await this.initialiseStorage();
    for (const img of images) {
      await this.saveImageToStorage(img);
    }
  }

  async addImage(image: NewImage) {
    await this.initialiseStorage();
    await this.saveImageToStorage(image);
  }

  async addImages(images: NewImage[]) {
    await this.initialiseStorage();
    for (const img of images) {
      await this.saveImageToStorage(img);
    }
  }

  async removeImage(image: NewImage) {
    await this.initialiseStorage();
    const guidString = image.id.toString(); // or handle value prop
    await this._storage?.remove(this.IMAGE_PREFIX + guidString);
  }

  private async saveImageToStorage(image: NewImage) {
    const guidString = image.id.toString();
    await this._storage?.set(this.IMAGE_PREFIX + guidString, image);
  }

  private deserializeImage(img: any): NewImage {
    return {
      ...img,
      id: this.parseGuid(img.id),
    };
  }

  /**
   * Helper method to parse a Guid from various formats
   */
  private parseGuid(guid: any): Guid {
    if (!guid) return Guid.createEmpty();

    if (guid instanceof Guid) return guid;

    if (typeof guid === 'object' && guid.value) {
      return Guid.parse(guid.value);
    }

    if (typeof guid === 'string') {
      return Guid.parse(guid);
    }

    return Guid.createEmpty();
  }
}
