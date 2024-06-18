import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import {
  IonActionSheet,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { Tree } from 'src/app/models/tree.interface';
import { Tab2Page } from 'src/app/tab2/tab2.page';
import { DatabaseService } from '../../services/database.service';

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
    IonSearchbar,
    IonActionSheet,
  ],
  providers: [ModalController, AlertController],
})
export class TreeGroupsComponent implements OnInit, OnDestroy {
  private selectedTreeId: string = '';
  private destroy$ = new Subject();

  public groups: Tree[] = [];
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
    private modalController: ModalController,
    private activeRoute: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.activeRoute.url.pipe(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        this.databaseService.startLoading('Loading Tree Groups');
        this.groups = await this.databaseService.getTreeGroups();
        this.initialiseLongPress();
        this.databaseService.stopLoading();
      },
    });
  }

  initialiseLongPress(): void {
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
    await modal.present();
    await modal.onDidDismiss();

    this.groups = await this.databaseService.getTreeGroups();
    this.initialiseLongPress();
  }

  getDescription(tree: Tree): string {
    return tree.description.replace(/\n/g, '<br>');
  }

  async filterGroups(filterString: any): Promise<void> {
    if (filterString) {
      filterString = filterString.toLowerCase();
      this.groups = (await this.databaseService.getTreeGroups()).filter((x) =>
        x.title.toLowerCase().includes(filterString)
      );
    } else {
      this.groups = await this.databaseService.getTreeGroups();
    }
    this.initialiseLongPress();
  }

  async deleteClicked(): Promise<void> {
    await this.databaseService.openDeleteTreeAlert(this.selectedTreeId);
    this.groups = await this.databaseService.getTreeGroups();
    this.initialiseLongPress();
  }

  ngOnDestroy(): void {
    this.destroy$.next(undefined);
    this.destroy$.complete();
  }
}
