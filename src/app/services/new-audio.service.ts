import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Guid } from 'guid-typescript';
import { AudioRecording } from '../models/audio-recording.interface';

@Injectable({
  providedIn: 'root',
})
export class NewAudioService {
  private _storage: Storage | null = null;
  private readonly AUDIO_PREFIX = 'audio_';

  constructor(private storage: Storage) {
    this.initialiseStorage();
  }

  async initialiseStorage(): Promise<void> {
    if (this._storage == null) {
      const storage = await this.storage.create();
      this._storage = storage;
    }
  }

  async getAudioFilesByGuid(guids: Guid[]): Promise<AudioRecording[]> {
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
  }

  async setAudioFiles(audioFiles: AudioRecording[]) {
    await this.addAudioFiles(audioFiles);
  }

  async addAudioFile(audioFile: AudioRecording) {
    await this.initialiseStorage();
    await this.saveAudioToStorage(audioFile);
  }

  async addAudioFiles(audioFiles: AudioRecording[]) {
    await this.initialiseStorage();
    for (const audioFile of audioFiles) {
      await this.saveAudioToStorage(audioFile);
    }
  }

  async removeAudioFile(audioFile: AudioRecording) {
    await this.initialiseStorage();
    const guidString =
      typeof audioFile.id === 'string' ? audioFile.id : (audioFile.id as any).value || audioFile.id.toString();
    await this._storage?.remove(`${this.AUDIO_PREFIX}${guidString}`);
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
