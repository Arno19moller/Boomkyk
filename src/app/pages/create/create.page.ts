import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ActionSheetController, NavController } from '@ionic/angular';
import {
  GestureController,
  IonBackButton,
  IonButton,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonList,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Guid } from 'guid-typescript';
import { Subject } from 'rxjs';
import { VoiceNote } from 'src/app/models/voice-notes.interface';
import { RecordingService } from 'src/app/services/recording.service';
import { ImageType } from '../../models/image-type.enum';
import { BoomkykPhoto } from '../../models/photo.interface';
import { TreeType } from '../../models/tree-type.enum';
import { Tree } from '../../models/tree.interface';
import { ActionsService } from '../../services/actions.service';
import { DatabaseService } from '../../services/database.service';
import { PhotoService } from '../../services/photo.service';
import { TreeFamiliesComponent } from '../tree-families/tree-families.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'create.page.html',
  styleUrls: ['create.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    TreeFamiliesComponent,
    IonFabButton,
    IonButton,
    IonFab,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonList,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonTextarea,
    IonToast,
    IonBackButton,
    IonToggle,
    FormsModule,
    CommonModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Tab2Page implements OnInit, OnDestroy {
  @ViewChild('ionInputEl') ionInputEl!: IonInput;
  @ViewChild('recordBtn', { read: ElementRef }) recordBtn!: ElementRef;

  private destroy$ = new Subject();
  private recordingTimeInterval: any;

  public newTree: Tree;
  public isEdit: boolean = false;
  public saveLocation: boolean = false;
  public TreeType = TreeType;
  public ImageType = ImageType;
  public parentGroup: Tree | undefined = undefined;
  public infoType: string = 'overview';
  public TreeInfoImages: BoomkykPhoto[] = [];
  public selectedImageType: ImageType = ImageType.Overview;
  public treeGroups: Tree[] = [];
  public errorMessage: string = '';
  public newLocations: Position[] = [];

  // voice recording
  duration: number = 0;

  constructor(
    public photoService: PhotoService,
    private databaseService: DatabaseService,
    public actionSheetController: ActionSheetController,
    private actionsService: ActionsService,
    public recordingService: RecordingService,
    private gestureCtrl: GestureController,
    private navCtrl: NavController,
  ) {
    this.newTree = this.actionsService.selectedTree ?? {
      id: Guid.create(),
      images: [],
      title: '',
      type: TreeType.Species,
      treeInfo: {
        overview: '',
        leaves: '',
        bark: '',
        flower: '',
        fruit: '',
      },
      voiceNotes: [],
    };
  }

  async ngOnInit(): Promise<void> {
    this.newLocations = [...(this.newTree.locations ?? [])];
    this.isEdit = this.actionsService.selectedTree != undefined;
    this.photoService.setTreeImages(this.newTree.images ?? []);
    this.recordingService.setTreeRecordings(this.newTree.voiceNotes ?? []);
    this.infoTypeChanged('overview');
    this.typeSelected();
  }

  async configureRecordBtn(): Promise<void> {
    await this.recordingService.checkAndRequestPermission();
    await this.recordingService.loadFiles(this.newTree);
    const longpress = this.gestureCtrl.create(
      {
        el: this.recordBtn.nativeElement,
        threshold: 0,
        gestureName: 'long-press',
        onStart: (ev) => {
          Haptics.impact({ style: ImpactStyle.Light });
          this.recordingService.startRecording();
          this.startRecordingTimer();
        },
        onEnd: (ev) => {
          Haptics.impact({ style: ImpactStyle.Light });
          clearInterval(this.recordingTimeInterval);
          this.recordingService.stopRecording(this.selectedImageType);
        },
      },
      true,
    );
    longpress.enable();
  }

  startRecordingTimer(): void {
    this.duration = 0;
    this.recordingTimeInterval = setInterval(() => {
      this.duration += 0.08;
    }, 80);
  }

  backClicked(): void {
    this.navCtrl.back();
  }

  async playNote(note: VoiceNote) {
    if (note.isPlaying) {
      this.recordingService.pausePlayback();
      note.isPlaying = false;
      return;
    }
    await this.recordingService.playFile(note);
  }

  async deleteNote(note: VoiceNote) {
    await this.recordingService.deleteRecording(note);
  }

  async addPhotoToGallery() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Add Photos',
      buttons: [
        {
          text: 'From Photos',
          role: 'destructive',
          icon: 'image',
          handler: async () => {
            await this.photoService.addMultipleImages(this.selectedImageType);
            this.TreeInfoImages = this.photoService.storedPhotos.filter((x) => x.type === this.selectedImageType);
          },
        },
        {
          text: 'Take Picture',
          role: 'destructive',
          icon: 'camera',
          handler: async () => {
            await this.photoService.addSingleImage(this.selectedImageType);
            this.TreeInfoImages = this.photoService.storedPhotos.filter((x) => x.type === this.selectedImageType);
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  public async showDeleteImageActionSheet(photo: BoomkykPhoto) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.photoService.deletePicture(photo);
            this.TreeInfoImages = this.photoService.storedPhotos.filter((x) => x.type === this.selectedImageType);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  public async showDeleteVoiceNoteActionSheet(note: VoiceNote) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Voice Note',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: async () => {
            await this.deleteNote(note);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  async typeSelected() {
    if (this.newTree!.type === TreeType.Species) {
      this.newTree!.treeInfo = this.newTree!.treeInfo ?? {
        overview: '',
        leaves: '',
        bark: '',
        fruit: '',
        flower: '',
      };
    }

    this.saveLocation = false;
    if (this.newTree!.type !== TreeType.Family) {
      this.newTree!.groupId = this.parentGroup?.id ?? this.newTree!.groupId;
      this.TreeInfoImages = this.photoService.storedPhotos.filter((x) => x.type === ImageType.Overview);

      this.treeGroups = await this.databaseService.getTreesByType(
        this.newTree!.type === TreeType.Genus ? TreeType.Family : TreeType.Genus,
      );
    } else {
      this.newTree!.treeInfo = undefined;
      this.newTree!.groupId = undefined;
    }

    if (this.newTree!.type === TreeType.Species) {
      setTimeout(() => {
        this.configureRecordBtn();
      }, 100);
    }
  }

  infoTypeChanged(type: string): void {
    this.infoType = type;
    if (this.infoType === 'overview') {
      this.selectedImageType = ImageType.Overview;
    } else if (this.infoType === 'leaves') {
      this.selectedImageType = ImageType.Leaves;
    } else if (this.infoType === 'bark') {
      this.selectedImageType = ImageType.Bark;
    } else if (this.infoType === 'fruit') {
      this.selectedImageType = ImageType.Fruit;
    } else if (this.infoType === 'flower') {
      this.selectedImageType = ImageType.Flower;
    }
    this.TreeInfoImages = this.photoService.storedPhotos.filter((x) => x.type === this.selectedImageType);
  }

  async onSubmit(): Promise<void> {
    if (this.newTree!.title === '') {
      this.databaseService.toastMessage = 'Please fill out all required fields';
      this.databaseService.openToast = true;
      return;
    } else if (this.newTree?.type === TreeType.Species && this.photoService.storedPhotos.length === 0) {
      this.databaseService.toastMessage = 'Please add at least one image';
      this.databaseService.openToast = true;
      return;
    }

    if (this.saveLocation && this.newLocations.length > 0) {
      this.newTree.locations = this.newTree.locations ?? [];
      this.newTree.locations = [...this.newTree.locations, ...this.newLocations];
    }

    if (this.isEdit) {
      this.photoService.saveTreeImages(this.newTree!);
      this.recordingService.saveTreeRecordings(this.newTree!);
      await this.databaseService.updateTree(this.newTree!);
    } else {
      this.photoService.saveTreeImages(this.newTree!);
      this.recordingService.saveTreeRecordings(this.newTree!);
      await this.databaseService.saveTree(this.newTree!);
    }

    this.databaseService.toastMessage = 'Tree Saved Successfully';
    this.databaseService.openToast = true;
    this.backClicked();
  }

  async locationToggleChanged() {
    if (this.saveLocation) {
      this.newLocations = [...this.newLocations, await Geolocation.getCurrentPosition()];
    } else {
      this.newLocations = this.newTree.locations ?? [];
    }
  }

  async ngOnDestroy() {
    this.destroy$.next(null);
    this.destroy$.complete();
    this.actionsService.selectedTree = undefined;

    await this.recordingService.clearRecordingList();
  }
}
function signal(arg0: never[]): Position[] {
  throw new Error('Function not implemented.');
}
