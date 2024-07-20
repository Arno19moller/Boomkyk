import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Position } from '@capacitor/geolocation';
import { ActionSheetController, NavController } from '@ionic/angular';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { ImageType } from 'src/app/models/image-type.enum';
import { BoomkykPhoto } from 'src/app/models/photo.interface';
import { Tree } from 'src/app/models/tree.interface';
import { VoiceNote } from 'src/app/models/voice-notes.interface';
import { ActionsService } from 'src/app/services/actions.service';
import { DatabaseService } from 'src/app/services/database.service';
import { RecordingService } from 'src/app/services/recording.service';
import { register } from 'swiper/element/bundle';
import { MapsPage } from '../maps/maps.page';

// SwiperCore.use(Zoom);
register();
@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonFooter,
    IonButton,
    IonButtons,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonLabel,
    IonList,
    IonItem,
    IonSegment,
    IonSegmentButton,
    IonBackButton,
    IonToggle,
    MapsPage,
    RouterModule,
    FormsModule,
    CommonModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TreeViewComponent implements OnInit, OnDestroy {
  @ViewChild('image', { read: ElementRef }) images: ElementRef<HTMLImageElement>[] | undefined;
  @ViewChild(IonModal) modal: IonModal | undefined;

  private destroy$ = new Subject();

  public tree: Tree | undefined = undefined;
  public overviewImages: BoomkykPhoto[] = [];
  public leafImages: BoomkykPhoto[] = [];
  public barkImages: BoomkykPhoto[] = [];
  public fruitImages: BoomkykPhoto[] = [];
  public flowerImages: BoomkykPhoto[] = [];
  public overviewDescription: string = '';
  public leafDescription: string = '';
  public barkDescription: string = '';
  public fruitDescription: string = '';
  public flowerDescription: string = '';
  public Type = ImageType;
  public locations: Position[] = [];
  public showLocation: boolean = false;
  public isModalOpen: boolean = false;
  public imgUrl: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    public databaseService: DatabaseService,
    private actionsService: ActionsService,
    private navCtrl: NavController,
    public actionSheetController: ActionSheetController,
    public recordingService: RecordingService,
  ) {}

  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: async (param) => {
        this.databaseService.startLoading('Loading Tree');
        await this.loadTree(param['id']);
        this.databaseService.stopLoading();
      },
    });
  }

  async editClicked(): Promise<void> {
    await this.actionsService.navigateToUpdate(this.tree?.id['value']);
    await this.loadTree(this.tree?.id['value']);
  }

  private async loadTree(id: string): Promise<void> {
    this.tree = await this.databaseService.getSelectedTree(id);

    this.overviewImages = this.tree?.images!.filter((x) => x.type === ImageType.Overview) ?? [];
    this.leafImages = this.tree?.images!.filter((x) => x.type === ImageType.Leaves) ?? [];
    this.barkImages = this.tree?.images!.filter((x) => x.type === ImageType.Bark) ?? [];
    this.fruitImages = this.tree?.images!.filter((x) => x.type === ImageType.Fruit) ?? [];
    this.flowerImages = this.tree?.images!.filter((x) => x.type === ImageType.Flower) ?? [];

    if (this.tree?.treeInfo) {
      this.overviewDescription = this.tree.treeInfo.overview.replace(/\n/g, '<br>');
      this.leafDescription = this.tree.treeInfo.leaves.replace(/\n/g, '<br>');
      this.barkDescription = this.tree.treeInfo.bark.replace(/\n/g, '<br>');
      this.fruitDescription = this.tree.treeInfo.fruit.replace(/\n/g, '<br>');
      this.flowerDescription = this.tree.treeInfo.flower.replace(/\n/g, '<br>');
    }

    this.locations = this.tree?.locations ?? [];
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
    if (this.tree?.voiceNotes !== undefined) {
      const index = this.tree?.voiceNotes?.findIndex((n: VoiceNote) => n.recordingName === note.recordingName);
      this.tree?.voiceNotes?.splice(index, 1);
      this.databaseService.updateTree(this.tree);
    }
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

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
