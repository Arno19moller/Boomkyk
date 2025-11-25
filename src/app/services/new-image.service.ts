import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { NewImage } from '../models/new-image.interface';

@Injectable({
  providedIn: 'root',
})
export class NewImageService {
  private images: NewImage[] = [];

  constructor() {}

  getImagesByGuids(guids: Guid[]): Promise<NewImage[]> {
    const images = this.images.filter((image) => guids.some((guid) => guid.toString() === image.id.toString()));
    return new Promise((resolve) => {
      resolve(images);
    });
  }

  setImages(images: NewImage[]) {
    this.images = images;
  }

  addImage(image: NewImage) {
    this.images.push(image);
  }

  addImages(images: NewImage[]) {
    this.images.push(...images);
  }

  removeImage(image: NewImage) {
    this.images = this.images.filter((imgs) => imgs.id.toString() !== image.id.toString());
  }
}
