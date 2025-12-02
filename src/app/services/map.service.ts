import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Guid } from 'guid-typescript';
import { Pin } from '../models/pin.interface';

import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private storage = inject(Storage);
  private loadingService = inject(LoadingService);

  private _storage: Storage | null = null;
  private readonly PIN_PREFIX = 'pin_';

  constructor() {
    this.initialiseStorage();
  }

  async initialiseStorage(): Promise<void> {
    if (this._storage == null) {
      const storage = await this.storage.create();
      this._storage = storage;
    }
  }

  async getPinsByGuid(guids: Guid[]): Promise<Pin[]> {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Loading pins...';
    }
    try {
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
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  async setPins(pins: Pin[]) {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Saving pins...';
    }
    try {
      await this.addPins(pins);
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  async addPin(pin: Pin) {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Adding pin...';
    }
    try {
      await this.initialiseStorage();
      await this.savePinToStorage(pin);
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  async addPins(pins: Pin[]) {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Adding pins...';
    }
    try {
      await this.initialiseStorage();
      for (const pin of pins) {
        await this.savePinToStorage(pin);
      }
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  async removePin(removePinId: Guid) {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Removing pin...';
    }
    try {
      await this.initialiseStorage();
      const guidString =
        typeof removePinId === 'string' ? removePinId : (removePinId as any).value || removePinId.toString();
      await this._storage?.remove(`${this.PIN_PREFIX}${guidString}`);
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
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
