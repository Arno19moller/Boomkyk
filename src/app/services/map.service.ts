import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Guid } from 'guid-typescript';
import { Pin } from '../models/pin.interface';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private _storage: Storage | null = null;
  private readonly PIN_PREFIX = 'pin_';

  constructor(private storage: Storage) {
    this.initialiseStorage();
  }

  async initialiseStorage(): Promise<void> {
    if (this._storage == null) {
      const storage = await this.storage.create();
      this._storage = storage;
    }
  }

  async getPinsByGuid(guids: Guid[]): Promise<Pin[]> {
    await this.initialiseStorage();
    const pins: Pin[] = [];

    for (const guid of guids) {
      const guidString = typeof guid === 'string' ? guid : (guid as any).value || guid.toString();
      const pin = await this._storage?.get(`${this.PIN_PREFIX}${guidString}`);

      if (pin) {
        pins.push(this.deserializePin(pin));
      }
    }

    return pins;
  }

  async setPins(pins: Pin[]) {
    await this.addPins(pins);
  }

  async addPin(pin: Pin) {
    await this.initialiseStorage();
    await this.savePinToStorage(pin);
  }

  async addPins(pins: Pin[]) {
    await this.initialiseStorage();
    for (const pin of pins) {
      await this.savePinToStorage(pin);
    }
  }

  async removePin(removePin: Pin) {
    await this.initialiseStorage();
    const guidString =
      typeof removePin.id === 'string' ? removePin.id : (removePin.id as any).value || removePin.id.toString();
    await this._storage?.remove(`${this.PIN_PREFIX}${guidString}`);
  }

  private async savePinToStorage(pin: Pin) {
    const guidString = typeof pin.id === 'string' ? pin.id : (pin.id as any).value || pin.id.toString();
    await this._storage?.set(`${this.PIN_PREFIX}${guidString}`, pin);
  }

  private deserializePin(pin: any): Pin {
    return {
      ...pin,
      id: this.parseGuid(pin.id),
      date: pin.date ? new Date(pin.date) : new Date(),
    };
  }

  private parseGuid(guid: any): Guid {
    if (!guid) return Guid.createEmpty();
    if (guid instanceof Guid) return guid;
    if (typeof guid === 'object' && guid.value) return Guid.parse(guid.value);
    if (typeof guid === 'string') return Guid.parse(guid);
    return Guid.createEmpty();
  }
}
