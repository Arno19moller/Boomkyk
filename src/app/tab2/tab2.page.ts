import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
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
} from '@ionic/angular/standalone';
import { TreeGroupsComponent } from '../tab1/tree-groups/tree-groups.component';
import { PhotoService } from '../services/photo.service';
import { ActionSheetController } from '@ionic/angular';
import { BoomkykPhoto } from '../models/photo.interface';
import { register } from 'swiper/element/bundle';
import { TreeType } from '../models/tree-type.enum';
import { Tree } from '../models/tree.interface';
import { Guid } from 'guid-typescript';
import { ImageType } from '../models/image-type.enum';
import { DatabaseService } from '../services/database.service';

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
export class Tab2Page implements OnInit {
  public newTree: Tree;
  public TreetType = TreeType;
  public parentGroup: Tree | undefined = undefined;
  public infoType: string = 'overview';
  public isToastOpen: boolean = false;
  public individualImages: BoomkykPhoto[] = [];
  public selectedImageType: ImageType = ImageType.Overview;
  public treeGroups: Tree[] = [];

  @ViewChild('ionInputEl') ionInputEl!: IonInput;

  constructor(
    public photoService: PhotoService,
    private databaseService: DatabaseService,
    public actionSheetController: ActionSheetController
  ) {
    this.newTree = {
      id: Guid.create(),
      images: [],
      title: '',
      subTitle: '',
      description: '',
      type: TreeType.Group,
    };
  }

  async ngOnInit(): Promise<void> {
    this.newTree.images = await this.photoService.loadSaved();
    register();
  }

  async addPhotoToGallery() {
    await this.photoService.addNewToGallery(
      this.newTree.images,
      this.selectedImageType
    );
    this.individualImages = this.newTree.images.filter(
      (x) => x.type === this.selectedImageType
    );
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

  async typeSelected(e: any) {
    this.newTree.type = e.detail.value;
    if (this.newTree.type === this.TreetType.Individual) {
      this.newTree.description = '';
      this.newTree.treeInfo = {
        overview: '',
        leaves: '',
        bark: '',
        fruit: '',
      };
      this.newTree.groupId = this.parentGroup?.id;
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
    console.log(this.newTree.groupId);
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
      }
    }
  }

  infoTypeChanged(e: any): void {
    this.infoType = e.target.value;
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
    }
    this.individualImages = this.newTree.images.filter(
      (x) => x.type === this.selectedImageType
    );
  }

  onSubmit(): void {
    if (
      this.newTree.title === '' ||
      (this.newTree.description === '' &&
        this.newTree.type === this.TreetType.Group)
    ) {
      this.isToastOpen = true;
    } else {
      console.log(this.newTree);

      this.databaseService.addTree(this.newTree);
    }
  }
}
