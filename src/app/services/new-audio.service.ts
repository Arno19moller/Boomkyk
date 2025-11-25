import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { AudioRecording } from '../models/audio-recording.interface';

@Injectable({
  providedIn: 'root',
})
export class NewAudioService {
  private audioRecordings: AudioRecording[] = [];

  constructor() {}

  getAudioFilesByGuid(guids: Guid[]): Promise<AudioRecording[]> {
    const recordings = this.audioRecordings.filter((audioRecording) =>
      guids.some((guid) => guid.toString() === audioRecording.id.toString()),
    );
    return new Promise((resolve) => {
      resolve(recordings);
    });
  }

  setAudioFiles(audioFiles: AudioRecording[]) {
    this.audioRecordings = audioFiles;
  }

  addAudioFile(audioFile: AudioRecording) {
    this.audioRecordings.push(audioFile);
  }

  addAudioFiles(audioFiles: AudioRecording[]) {
    this.audioRecordings.push(...audioFiles);
  }

  removeAudioFile(audioFile: AudioRecording) {
    this.audioRecordings = this.audioRecordings.filter(
      (audioRecording) => audioRecording.id.toString() !== audioFile.id.toString(),
    );
  }
}
