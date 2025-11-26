import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Pin } from '../models/pin.interface';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private pins: Pin[] = [];

  constructor() {}

  getPinsByGuid(guids: Guid[]): Promise<Pin[]> {
    const pins = this.pins.filter((pin) => guids.some((guid) => guid.toString() === pin.id.toString()));
    return new Promise((resolve) => {
      resolve(pins);
    });
  }

  setPins(pins: Pin[]) {
    this.pins = pins;
  }

  addPin(pin: Pin) {
    this.pins.push(pin);
  }

  addPins(pins: Pin[]) {
    this.pins.push(...pins);
  }

  removePin(removePin: Pin) {
    this.pins = this.pins.filter((pin) => pin.id.toString() !== removePin.id.toString());
  }
}
