import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { TreeGroupsComponent } from '../tab1/tree-groups/tree-groups.component';
import { PhotoService } from '../services/photo.service';
import { ActionSheetController } from '@ionic/angular';
import { BoomkykPhoto } from '../models/photo.interface';
import { register } from 'swiper/element/bundle';

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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Tab2Page implements OnInit {
  constructor(
    public photoService: PhotoService,
    public actionSheetController: ActionSheetController
  ) {}

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
    register();
  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  public async showActionSheet(photo: BoomkykPhoto, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.photoService.deletePicture(photo, position);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            // Nothing to do, action sheet is automatically closed
          },
        },
      ],
    });
    await actionSheet.present();
  }
}
