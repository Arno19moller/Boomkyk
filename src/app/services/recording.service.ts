import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RecordingService {
  private media: MediaObject | undefined;
  private recordingFilePath: string | undefined;

  constructor() {}

  async startRecording() {
    // ... recording logic
  }

  async stopRecording() {
    // ... stop recording logic
  }

  async playRecording(filePath: string) {
    // ... playback logic
  }

  async deleteRecording(filePath: string) {
    // ... delete logic
  }
}
