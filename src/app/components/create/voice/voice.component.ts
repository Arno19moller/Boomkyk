import { Component, model, OnInit } from '@angular/core';
import { Directory } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonCard,
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

@Component({
  standalone: true,
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss'],
  imports: [IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonItem, IonList, IonButton, IonIcon, IonCard],
})
export class VoiceComponent implements OnInit {
  audioFiles = model.required<AudioRecording[] | undefined>();

  protected longPressInterval: any;
  protected loadingText: string = 'Recording';
  protected isRecording: boolean = false;
  protected audioRef: HTMLAudioElement | undefined;

  constructor() {}

  async ngOnInit() {
    await VoiceRecorder.requestAudioRecordingPermission();
  }

  async startLongPress() {
    let dotCount = 1;

    if (this.isRecording) return;
    this.isRecording = true;
    VoiceRecorder.startRecording();
    await Haptics.impact({ style: ImpactStyle.Light });

    this.longPressInterval = setInterval(async () => {
      if (this.isRecording) {
        this.loadingText = `Recording${'.'.repeat(dotCount)}`;
        dotCount = (dotCount + 1) % 6;
      }
    }, 300);
  }

  async endLongPress() {
    clearTimeout(this.longPressInterval);

    if (!this.isRecording) return;

    this.isRecording = false;
    const result = await VoiceRecorder.stopRecording();
    if (result?.value?.recordDataBase64) {
      const recordData = result.value.recordDataBase64;
      const fileName = `${new Date().getTime()}.wav`;
      this.audioFiles.update((files) => {
        files = files == undefined ? [] : files;
        files.push({
          path: fileName,
          directory: Directory.Data,
          data: recordData,
          name: fileName,
          isPlaying: false,
        });
        return files;
      });
    }
    await Haptics.impact({ style: ImpactStyle.Light });
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
    const index = this.audioFiles()!.indexOf(audioFile);
    this.audioFiles.update((files) => {
      files = files == undefined ? [] : files;
      files.splice(index, 1);
      return files;
    });
  }
}
