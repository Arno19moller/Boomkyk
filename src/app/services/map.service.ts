import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Pin } from '../models/pin.interface';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private pins: Pin[] = [];

  constructor() {}

  getAudioFilesByGuid(guids: Guid[]): Promise<Pin[]> {
    const pins = this.pins.filter((pin) => guids.some((guid) => guid.toString() === pin.id.toString()));
    return new Promise((resolve) => {
      resolve(pins);
    });
  }

  setAudioFiles(pins: Pin[]) {
    this.pins = pins;
  }

  addAudioFile(pin: Pin) {
    this.pins.push(pin);
  }

  addAudioFiles(pins: Pin[]) {
    this.pins.push(...pins);
  }

  removeAudioFile(removePin: Pin) {
    this.pins = this.pins.filter((pin) => pin.id.toString() !== removePin.id.toString());
  }
}
