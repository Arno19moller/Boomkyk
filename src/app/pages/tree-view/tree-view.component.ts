import { CommonModule, LocationStrategy } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';
import {
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
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonTitle,
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
    RouterModule,
    CommonModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TreeViewComponent implements OnInit, OnDestroy {
  @ViewChild('image', { read: ElementRef }) images: ElementRef<HTMLImageElement>[] | undefined;

  private destroy$ = new Subject();
  private zoomLvl: number = 1;

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

  constructor(
    private activatedRoute: ActivatedRoute,
    public databaseService: DatabaseService,
    private actionsService: ActionsService,
    private locationStrategy: LocationStrategy,
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

  async deleteClicked(): Promise<void> {
    const val = await this.actionsService.openDeleteConfirmation(this.tree?.id['value']);
    if (val === 'confirm') {
      this.locationStrategy.back();
    }
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

    this.initialiseDoubleClick();
  }

  indexChanged(): void {
    this.initialiseDoubleClick();
  }

  initialiseDoubleClick(): void {
    setTimeout(() => {
      const imageElements = document.querySelectorAll('ion-img');

      for (let i = 0; i < imageElements.length; i++) {
        const hasDoubletap = imageElements[i]!.getAttribute('doubletap');

        // Only assign long press when new
        if (hasDoubletap == null) {
          imageElements[i]!.setAttribute('doubletap', 'true');
          imageElements[i]!.setAttribute('height', `${imageElements[i]!.parentElement?.clientHeight ?? 0}`);
          imageElements[i]!.setAttribute('width', `${imageElements[i]!.parentElement?.clientWidth ?? 0}`);

          const hammer = new Hammer(imageElements[i]!);

          hammer.get('doubletap').set({ time: 500 });
          hammer.on('doubletap', async () => {
            return this.zoomImage(imageElements[i]);
          });
        }
      }
    }, 200);
  }

  private zoomImage(image: HTMLIonImgElement) {
    image.style.setProperty('transform', this.getNewTransform());

    const paddingVal = this.zoomLvl === 1.5 ? 1 : 2;
    const height = image.getAttribute('height') ?? 0;
    const width = image.getAttribute('width') ?? 0;

    image.parentElement?.style.setProperty('padding-left', this.zoomLvl === 1 ? '0' : `${(+width / 6) * paddingVal}px`);
    image.parentElement?.style.setProperty('padding-top', this.zoomLvl === 1 ? '0' : `${(+height / 6) * paddingVal}px`);
  }

  private getNewTransform() {
    this.zoomLvl = this.zoomLvl >= 2 ? 1 : this.zoomLvl + 0.5;
    return `scale(${this.zoomLvl})`;
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

  backClicked(): void {
    this.locationStrategy.back();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
