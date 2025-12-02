import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Guid } from 'guid-typescript';
import { AudioRecording } from '../models/audio-recording.interface';

import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root',
})
export class NewAudioService {
  private storage = inject(Storage);
  private loadingService = inject(LoadingService);

  private _storage: Storage | null = null;
  private readonly AUDIO_PREFIX = 'audio_';

  constructor() {
    this.initialiseStorage();
  }

  async initialiseStorage(): Promise<void> {
    if (this._storage == null) {
      const storage = await this.storage.create();
      this._storage = storage;
    }
  }

  async getAudioFilesByGuid(guids: Guid[]): Promise<AudioRecording[]> {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Loading audio...';
    }
    try {
      await this.initialiseStorage();
      const recordings: AudioRecording[] = [];

      for (const guid of guids) {
        const guidString = typeof guid === 'string' ? guid : (guid as any).value || guid.toString();
        const recording = await this._storage?.get(`${this.AUDIO_PREFIX}${guidString}`);

        if (recording) {
          recordings.push(this.deserializeAudio(recording));
        }
      }

      return recordings;
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  async setAudioFiles(audioFiles: AudioRecording[]) {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Saving audio...';
    }
    try {
      await this.addAudioFiles(audioFiles);
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  async addAudioFile(audioFile: AudioRecording) {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Adding audio...';
    }
    try {
      await this.initialiseStorage();
      await this.saveAudioToStorage(audioFile);
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  async addAudioFiles(audioFiles: AudioRecording[]) {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Adding audio...';
    }
    try {
      await this.initialiseStorage();
      for (const audioFile of audioFiles) {
        await this.saveAudioToStorage(audioFile);
      }
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  async removeAudioFile(audioFileId: Guid) {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Removing audio...';
    }
    try {
      await this.initialiseStorage();
      const guidString =
        typeof audioFileId === 'string' ? audioFileId : (audioFileId as any).value || audioFileId.toString();
      await this._storage?.remove(`${this.AUDIO_PREFIX}${guidString}`);
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  private async saveAudioToStorage(audioFile: AudioRecording) {
    const guidString =
      typeof audioFile.id === 'string' ? audioFile.id : (audioFile.id as any).value || audioFile.id.toString();
    await this._storage?.set(`${this.AUDIO_PREFIX}${guidString}`, audioFile);
  }

  private deserializeAudio(audio: any): AudioRecording {
    return {
      ...audio,
      id: this.parseGuid(audio.id),
      isPlaying: false, // Reset playing state on load
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
