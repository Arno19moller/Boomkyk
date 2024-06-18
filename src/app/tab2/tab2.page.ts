import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActionSheetController, ModalController } from '@ionic/angular';
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
import { ImageType } from '../models/image-type.enum';
import { BoomkykPhoto } from '../models/photo.interface';
import { TreeType } from '../models/tree-type.enum';
import { Tree } from '../models/tree.interface';
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
  providers: [ModalController],
})
export class Tab2Page implements OnInit {
  @ViewChild('ionInputEl') ionInputEl!: IonInput;

  @Input() showBackButton: boolean = false;
  @Input() public newTree: Tree;

  private newId: Guid;

  public isEdit: boolean = false;
  public TreetType = TreeType;
  public parentGroup: Tree | undefined = undefined;
  public infoType: string = 'overview';
  public isErrorToastOpen: boolean = false;
  public isSavedToastOpen: boolean = false;
  public individualImages: BoomkykPhoto[] = [];
  public selectedImageType: ImageType = ImageType.Overview;
  public treeGroups: Tree[] = [];
  public errorMessage: string = '';

  constructor(
    public photoService: PhotoService,
    private databaseService: DatabaseService,
    public actionSheetController: ActionSheetController,
    private modalCtrl: ModalController
  ) {
    this.newId = Guid.create();
    this.newTree = {
      id: this.newId,
      images: [],
      title: '',
      subTitle: '',
      description: '',
      type: TreeType.Group,
    };
  }

  async ngOnInit(): Promise<void> {
    if (this.newTree.id !== this.newId) {
      this.typeSelected(this.newTree.type);
      if (this.newTree.type === TreeType.Individual) {
        setTimeout(() => {
          this.infoTypeChanged('overview');
        }, 100);
      }
      this.isEdit = true;
    }
  }

  backClicked(): void {
    this.modalCtrl.dismiss();
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
              this.newTree.images,
              this.selectedImageType
            );
            this.individualImages = this.newTree.images.filter(
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
              this.newTree.images,
              this.selectedImageType
            );
            this.individualImages = this.newTree.images.filter(
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

  public async showImageActionSheet(photo: BoomkykPhoto) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.photoService.deletePicture(this.newTree.images, photo);
            this.individualImages = this.newTree.images.filter(
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
    this.newTree.type = type;
    if (this.newTree.type === this.TreetType.Individual) {
      this.newTree.description = '';
      this.newTree.treeInfo = this.newTree.treeInfo ?? {
        overview: '',
        leaves: '',
        bark: '',
        fruit: '',
        flower: '',
      };

      this.newTree.groupId = this.parentGroup?.id ?? this.newTree.groupId;
      this.individualImages = this.newTree.images.filter(
        (x) => x.type === ImageType.Overview
      );

      this.treeGroups = await this.databaseService.getTreeGroups();
    } else {
      this.newTree.treeInfo = undefined;
      this.newTree.groupId = undefined;
    }
  }

  groupSelected(e: any): void {
    this.newTree.groupId = e.detail.value;
  }

  textInputChanged(control: string, e: any): void {
    if (control === 'title') {
      this.newTree.title = e.target.value;
    } else if (control === 'science') {
      this.newTree.subTitle = e.target.value;
    } else if (control === 'groupDescription') {
      this.newTree.description = e.target.value;
    } else if (control === 'individualDescription') {
      if (this.infoType === 'overview') {
        this.newTree.treeInfo!.overview = e.target.value;
      } else if (this.infoType === 'leaves') {
        this.newTree.treeInfo!.leaves = e.target.value;
      } else if (this.infoType === 'bark') {
        this.newTree.treeInfo!.bark = e.target.value;
      } else if (this.infoType === 'fruit') {
        this.newTree.treeInfo!.fruit = e.target.value;
      } else if (this.infoType === 'flower') {
        this.newTree.treeInfo!.flower = e.target.value;
      }
    }
  }

  infoTypeChanged(type: string): void {
    this.infoType = type;
    if (this.infoType === 'overview') {
      this.selectedImageType = ImageType.Overview;
      this.ionInputEl.value = this.newTree.treeInfo!.overview;
    } else if (this.infoType === 'leaves') {
      this.selectedImageType = ImageType.Leaves;
      this.ionInputEl.value = this.newTree.treeInfo!.leaves;
    } else if (this.infoType === 'bark') {
      this.selectedImageType = ImageType.Bark;
      this.ionInputEl.value = this.newTree.treeInfo!.bark;
    } else if (this.infoType === 'fruit') {
      this.selectedImageType = ImageType.Fruit;
      this.ionInputEl.value = this.newTree.treeInfo!.fruit;
    } else if (this.infoType === 'flower') {
      this.selectedImageType = ImageType.Flower;
      this.ionInputEl.value = this.newTree.treeInfo!.flower;
    }
    this.individualImages = this.newTree.images.filter(
      (x) => x.type === this.selectedImageType
    );
  }

  async onSubmit(): Promise<void> {
    if (
      this.newTree.title === '' ||
      (this.newTree.description === '' &&
        this.newTree.type === this.TreetType.Group)
    ) {
      this.errorMessage = 'Please fill out all required fields';
      this.isErrorToastOpen = true;
    } else if (this.newTree.images.length === 0) {
      this.errorMessage = 'Please add at least one image';
      this.isErrorToastOpen = true;
    } else {
      if (this.isEdit) {
        await this.databaseService.updateTree(this.newTree);
      } else {
        await this.databaseService.addTree(this.newTree);
      }
      this.isSavedToastOpen = true;
      this.resetNewTree();
      this.backClicked();
    }
  }

  resetNewTree(): void {
    this.newTree = {
      id: Guid.create(),
      images: [],
      title: '',
      subTitle: '',
      description: '',
      type: TreeType.Group,
    };
  }

  ionViewWillLeave(): void {
    this.resetNewTree();
  }
}
