import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonActionSheet,
} from '@ionic/angular/standalone';
import { DatabaseService } from '../../services/database.service';
import { RouterModule } from '@angular/router';
import { Tree } from 'src/app/models/tree.interface';
import { ModalController } from '@ionic/angular';
import { Tab2Page } from 'src/app/tab2/tab2.page';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tree-groups',
  templateUrl: './tree-groups.component.html',
  styleUrls: ['./tree-groups.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonCardSubtitle,
    RouterModule,
    IonActionSheet,
  ],
  providers: [ModalController, AlertController],
})
export class TreeGroupsComponent implements AfterViewInit {
  @Input() groups: Tree[] = [];

  private selectedTreeId: string = '';

  public isActionSheetOpen = false;
  public actionSheetButtons = [
    {
      text: 'Edit',
      role: 'destructive',
      icon: 'create',
      data: {
        action: 'edit',
      },
      handler: async () => {
        await this.updateClicked();
      },
    },
    {
      text: 'Delete',
      role: 'destructive',
      icon: 'trash',
      data: {
        action: 'delete',
      },
      handler: async () => {
        await this.deleteClicked();
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
      data: {
        action: 'cancel',
      },
    },
  ];

  constructor(
    private databaseService: DatabaseService,
    private modalController: ModalController
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      const cardElements = document.querySelectorAll('ion-card');
      for (let i = 0; i < cardElements.length; i++) {
        const hammer = new Hammer(cardElements[i]!);

        hammer.get('press').set({ time: 500 });
        hammer.on('press', () => {
          const id = cardElements[i]?.getAttribute('id');
          return this.cardClicked(id);
        });
      }
    }, 100);
  }

  cardClicked(id: string | undefined | null): void {
    this.selectedTreeId = id ?? '';
    this.isActionSheetOpen = true;
  }

  async updateClicked(): Promise<void> {
    const tree = await this.databaseService.getSelectedTree(
      this.selectedTreeId
    );

    const modal = await this.modalController.create({
      component: Tab2Page,
      componentProps: {
        newTree: tree,
        showBackButton: true,
      },
    });
    return await modal.present();
  }

  async deleteClicked(): Promise<void> {
    await this.databaseService.deleteTree(this.selectedTreeId);
  }
}
