import { Component, effect, inject, input, model, OnInit, signal } from '@angular/core';
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
import { Guid } from 'guid-typescript';
import { LongPressDirective } from 'src/app/directives/long-press.directive';
import { AudioRecording } from 'src/app/models/audio-recording.interface';
import { NewCategoryItem } from 'src/app/models/new-category.interface';
import { NewAudioService } from 'src/app/services/new-audio.service';
import { PopupComponent } from '../../popup/popup.component';

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
    IonCard,
    PopupComponent,
    LongPressDirective,
  ],
})
export class VoiceComponent implements OnInit {
  newAudioService = inject(NewAudioService);

  selectedCategoryItem = input.required<NewCategoryItem | undefined>();
  audioFiles = model.required<AudioRecording[]>();

  protected longPressInterval: any;
  protected loadingText: string = 'Recording';
  protected isRecording: boolean = false;
  protected audioRef: HTMLAudioElement | undefined;
  protected openConfirmDelete = signal<boolean>(false);
  protected confirmDeleteBody: string = '';
  private selectedRecordingIndex: number | undefined = undefined;

  constructor() {
    effect(() => {
      if (this.selectedCategoryItem()?.audioFileIds) {
        this.newAudioService.getAudioFilesByGuid(this.selectedCategoryItem()?.audioFileIds!).then((audioFiles) => {
          this.audioFiles.set(audioFiles);
        });
      }
    });
  }

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
      const index = this.audioFiles()?.slice(-1)[0]?.index ?? 0;
      const newAudio = {
        id: Guid.create(),
        //path: fileName,
        directory: Directory.Data,
        data: recordData,
        name: fileName,
        index: index + 1,
        isPlaying: false,
      };

      this.audioFiles.update((files) => {
        files = files == undefined ? [] : files;
        files.push(newAudio);
        return files;
      });
    }
    await Haptics.impact({ style: ImpactStyle.Light });
  }

  async playFile(audioFile: AudioRecording): Promise<void> {
    const base64Sound = audioFile.data;

    this.audioRef = new Audio(`data:audio/aac;base64,${base64Sound}`);

    if (audioFile.isPlaying) {
      this.audioRef!.pause();
      this.audioRef!.currentTime = 0;
      audioFile.isPlaying = false;
    } else {
      this.audioRef.oncanplaythrough = () => {
        audioFile.isPlaying = true;
        this.audioRef!.play();
      };
      this.audioRef.onended = () => {
        audioFile.isPlaying = false;
      };
      this.audioRef.load();
    }
  }

  deleteButtonClicked(audioFile: AudioRecording): void {
    const index = this.audioFiles()!.indexOf(audioFile);
    this.selectedRecordingIndex = index;

    this.confirmDeleteBody = `Are you sure you want to delete Voice Note ${audioFile.index}`;
    this.openConfirmDelete.set(true);
  }

  deletePopupClosed(role: string) {
    if (role === 'confirm') {
      this.deleteRecording(this.selectedRecordingIndex!);
    }
  }

  deleteRecording(index: number): void {
    this.audioFiles.update((files) => {
      files = files == undefined ? [] : files;
      files.splice(index, 1);
      return files;
    });
  }
}
