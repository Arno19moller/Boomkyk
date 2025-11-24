import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { ImageType } from '../models/legacy/image-type.enum';
import { Tree } from '../models/legacy/tree.interface';
import { VoiceNote } from '../models/legacy/voice-notes.interface';

@Injectable({
  providedIn: 'root',
})
export class RecordingService {
  public recording: boolean = false;
  public storedFileNames: VoiceNote[] = [];
  public audioRef: HTMLAudioElement | undefined;

  constructor() {}

  async checkAndRequestPermission() {
    await VoiceRecorder.requestAudioRecordingPermission();
  }

  async loadFiles(tree: Tree | undefined): Promise<void> {
    if (tree) {
      tree.voiceNotes = tree.voiceNotes ?? [];
      this.storedFileNames = tree.voiceNotes ?? [];
    }
  }

  startRecording() {
    if (this.recording) return;

    this.recording = true;
    VoiceRecorder.startRecording();
  }

  async stopRecording(recordingType: ImageType): Promise<void> {
    if (!this.recording) return;

    this.recording = false;
    const result = await VoiceRecorder.stopRecording();
    if (result?.value?.recordDataBase64) {
      const recordData = result.value.recordDataBase64;
      const fileName = `${new Date().getTime()}.wav`;
      await Filesystem.writeFile({
        path: fileName,
        directory: Directory.Data,
        data: recordData,
      });

      this.storedFileNames.push({
        recordingName: fileName,
        type: recordingType,
        isPlaying: false,
      });
    }
  }

  async playFile(note: VoiceNote): Promise<void> {
    const audioFile = await Filesystem.readFile({
      path: note.recordingName,
      directory: Directory.Data,
    });
    const base64Sound = audioFile.data;

    this.audioRef = new Audio(`data:audio/aac;base64,${base64Sound}`);
    this.audioRef.oncanplaythrough = () => {
      note.isPlaying = true;
      this.audioRef!.play();
    };
    this.audioRef.onended = () => {
      note.isPlaying = false;
    };
    this.audioRef.load();
  }

  pausePlayback() {
    if (this.audioRef) this.audioRef.pause();
  }

  async deleteRecording(note: VoiceNote) {
    await Filesystem.deleteFile({
      path: note.recordingName,
      directory: Directory.Data,
    });

    const index = this.storedFileNames.findIndex((n: VoiceNote) => n.recordingName === note.recordingName);
    this.storedFileNames.splice(index, 1);
  }

  setTreeRecordings(recordings: VoiceNote[]) {
    this.storedFileNames = recordings;
  }

  saveTreeRecordings(tree: Tree) {
    tree.voiceNotes = this.storedFileNames;
    this.storedFileNames = [];
  }

  async clearRecordingList() {
    this.storedFileNames.map(async (recording) => {
      await this.deleteRecording(recording);
    });
  }
}
