import { LocationStrategy } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import {
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
  IonToolbar,
} from '@ionic/angular/standalone';
import { Guid } from 'guid-typescript';
import { Subject } from 'rxjs';
import { ImageType } from '../models/image-type.enum';
import { BoomkykPhoto } from '../models/photo.interface';
import { TreeType } from '../models/tree-type.enum';
import { Tree } from '../models/tree.interface';
import { ActionsService } from '../services/actions.service';
import { DatabaseService } from '../services/database.service';
import { PhotoService } from '../services/photo.service';
import { TreeGroupsComponent } from '../tab1/tree-groups/tree-groups.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    TreeGroupsComponent,
    IonFabButton,
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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Tab2Page implements OnInit, OnDestroy {
  @ViewChild('ionInputEl') ionInputEl!: IonInput;

  private destroy$ = new Subject();

  public newTree: Tree | undefined = undefined;
  public isEdit: boolean = false;
  public TreetType = TreeType;
  public parentGroup: Tree | undefined = undefined;
  public infoType: string = 'overview';
  public individualImages: BoomkykPhoto[] = [];
  public selectedImageType: ImageType = ImageType.Overview;
  public treeGroups: Tree[] = [];
  public errorMessage: string = '';

  constructor(
    public photoService: PhotoService,
    private databaseService: DatabaseService,
    public actionSheetController: ActionSheetController,
    private locationStrategy: LocationStrategy,
    private actionsService: ActionsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.newTree = this.actionsService.selectedTree ?? {
      id: Guid.create(),
      images: [],
      title: '',
      subTitle: '',
      description: '',
      type: this.actionsService.selectedTreeType ?? TreeType.Group,
    };

    this.isEdit = this.actionsService.selectedTree != undefined;

    if (this.actionsService.selectedTreeType === TreeType.Individual) {
      this.typeSelected(this.newTree.type);
      setTimeout(() => {
        this.infoTypeChanged('overview');
      }, 100);
    }
  }

  backClicked(): void {
    this.locationStrategy.back();
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
            await this.photoService.addMultipleImages(
              this.newTree!.images,
              this.selectedImageType
            );
            this.individualImages = this.newTree!.images.filter(
              (x) => x.type === this.selectedImageType
            );
          },
        },
        {
          text: 'Take Picture',
          role: 'destructive',
          icon: 'camera',
          handler: async () => {
            await this.photoService.addSingleImage(
              this.newTree!.images,
              this.selectedImageType
            );
            this.individualImages = this.newTree!.images.filter(
              (x) => x.type === this.selectedImageType
            );
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
            this.photoService.deletePicture(this.newTree!.images, photo);
            this.individualImages = this.newTree!.images.filter(
              (x) => x.type === this.selectedImageType
            );
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

  async typeSelected(type: any) {
    this.newTree!.type = type;
    if (this.newTree!.type === this.TreetType.Individual) {
      this.newTree!.description = '';
      this.newTree!.treeInfo = this.newTree!.treeInfo ?? {
        overview: '',
        leaves: '',
        bark: '',
        fruit: '',
        flower: '',
      };

      this.newTree!.groupId = this.parentGroup?.id ?? this.newTree!.groupId;
      this.individualImages = this.newTree!.images.filter(
        (x) => x.type === ImageType.Overview
      );

      this.treeGroups = await this.databaseService.getTreeGroups();
    } else {
      this.newTree!.treeInfo = undefined;
      this.newTree!.groupId = undefined;
    }
  }

  groupSelected(e: any): void {
    this.newTree!.groupId = e.detail.value;
  }

  textInputChanged(control: string, e: any): void {
    if (control === 'title') {
      this.newTree!.title = e.target.value;
    } else if (control === 'science') {
      this.newTree!.subTitle = e.target.value;
    } else if (control === 'groupDescription') {
      this.newTree!.description = e.target.value;
    } else if (control === 'individualDescription') {
      if (this.infoType === 'overview') {
        this.newTree!.treeInfo!.overview = e.target.value;
      } else if (this.infoType === 'leaves') {
        this.newTree!.treeInfo!.leaves = e.target.value;
      } else if (this.infoType === 'bark') {
        this.newTree!.treeInfo!.bark = e.target.value;
      } else if (this.infoType === 'fruit') {
        this.newTree!.treeInfo!.fruit = e.target.value;
      } else if (this.infoType === 'flower') {
        this.newTree!.treeInfo!.flower = e.target.value;
      }
    }
  }

  infoTypeChanged(type: string): void {
    this.infoType = type;
    if (this.infoType === 'overview') {
      this.selectedImageType = ImageType.Overview;
      this.ionInputEl.value = this.newTree!.treeInfo!.overview;
    } else if (this.infoType === 'leaves') {
      this.selectedImageType = ImageType.Leaves;
      this.ionInputEl.value = this.newTree!.treeInfo!.leaves;
    } else if (this.infoType === 'bark') {
      this.selectedImageType = ImageType.Bark;
      this.ionInputEl.value = this.newTree!.treeInfo!.bark;
    } else if (this.infoType === 'fruit') {
      this.selectedImageType = ImageType.Fruit;
      this.ionInputEl.value = this.newTree!.treeInfo!.fruit;
    } else if (this.infoType === 'flower') {
      this.selectedImageType = ImageType.Flower;
      this.ionInputEl.value = this.newTree!.treeInfo!.flower;
    }
    this.individualImages = this.newTree!.images.filter(
      (x) => x.type === this.selectedImageType
    );
  }

  async onSubmit(): Promise<void> {
    if (
      this.newTree!.title === '' ||
      (this.newTree!.description === '' &&
        this.newTree!.type === this.TreetType.Group)
    ) {
      this.databaseService.toastMessage = 'Please fill out all required fields';
      this.databaseService.openToast = true;
    } else if (this.newTree!.images.length === 0) {
      this.databaseService.toastMessage = 'Please add at least one image';
      this.databaseService.openToast = true;
    } else {
      if (this.isEdit) {
        await this.databaseService.updateTree(this.newTree!);
      } else {
        await this.databaseService.addTree(this.newTree!);
      }
      this.databaseService.toastMessage = 'Tree Saved Successfully';
      this.databaseService.openToast = true;
      this.backClicked();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
    this.actionsService.selectedTree = undefined;
    this.actionsService.selectedTreeType = undefined;
  }
}
