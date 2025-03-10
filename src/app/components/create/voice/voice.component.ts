import { Component, OnInit } from '@angular/core';
import { Directory } from '@capacitor/filesystem';
import {
  IonButton,
  IonCard,
  IonFooter,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { AudioRecording } from 'src/app/models/audio-recording.interface';
import { VoiceNote } from 'src/app/models/voice-notes.interface';

@Component({
  standalone: true,
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss'],
  imports: [
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonItem,
    IonList,
    IonButton,
    IonIcon,
    IonFooter,
    IonCard,
  ],
})
export class VoiceComponent implements OnInit {
  longPressInterval: any;
  loadingText: string = 'Recording';
  audioFiles: AudioRecording[] = [];

  public recording: boolean = false;
  public storedFileNames: VoiceNote[] = [];
  public audioRef: HTMLAudioElement | undefined;

  constructor() {}

  async ngOnInit() {
    await VoiceRecorder.requestAudioRecordingPermission();
  }

  async startLongPress() {
    let dotCount = 1;

    if (this.recording) return;
    this.recording = true;
    VoiceRecorder.startRecording();

    this.longPressInterval = setInterval(() => {
      if (this.recording) {
        this.loadingText = `Recording${'.'.repeat(dotCount)}`;
        dotCount = (dotCount + 1) % 6;
      }
    }, 300);
  }

  async endLongPress() {
    clearTimeout(this.longPressInterval);

    if (!this.recording) return;

    this.recording = false;
    const result = await VoiceRecorder.stopRecording();
    if (result?.value?.recordDataBase64) {
      const recordData = result.value.recordDataBase64;
      const fileName = `${new Date().getTime()}.wav`;
      this.audioFiles.push({
        path: fileName,
        directory: Directory.Data,
        data: recordData,
        name: fileName,
        isPlaying: false,
      });
    }
  }

  async playFile(audioFile: AudioRecording): Promise<void> {
    const base64Sound = audioFile.data;

    this.audioRef = new Audio(`data:audio/aac;base64,${base64Sound}`);
    this.audioRef.oncanplaythrough = () => {
      audioFile.isPlaying = true;
      this.audioRef!.play();
    };
    this.audioRef.onended = () => {
      audioFile.isPlaying = false;
    };
    this.audioRef.load();
  }

  deleteRecording(audioFile: AudioRecording): void {
    const index = this.audioFiles.indexOf(audioFile);
    this.audioFiles.splice(index, 1);
  }
}
