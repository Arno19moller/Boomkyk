import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ModalController } from '@ionic/angular';
import {
  IonActionSheet,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonModal,
  IonRow,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import * as Hammer from 'hammerjs';
import { Subject, takeUntil } from 'rxjs';
import { ImageType } from 'src/app/models/image-type.enum';
import { BoomkykPhoto } from 'src/app/models/photo.interface';
import { Tree } from 'src/app/models/tree.interface';
import { DatabaseService } from 'src/app/services/database.service';
import { Tab2Page } from 'src/app/tab2/tab2.page';

@Component({
  selector: 'app-tree-list',
  templateUrl: './tree-list.component.html',
  styleUrls: ['./tree-list.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
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
    IonSearchbar,
    IonActionSheet,
    IonModal,
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [ModalController],
})
export class TreeListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();
  private treeGroupId: string | undefined = undefined;
  private selectedTreeId: string = '';

  public treesList: Tree[] = [];
  public title: string = '';
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

  @ViewChild('longPressElement') longPressElement: ElementRef | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    public databaseService: DatabaseService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: async (param) => {
        this.databaseService.startLoading('Loading Trees');
        this.treeGroupId = param['id'];
        await this.databaseService.setSelectedTreeGroup(param['id']);
        this.treesList = await this.databaseService.getTreesList(param['id']);
        this.title =
          (await this.databaseService.getSelectedTree(param['id']))?.title ??
          'Not Found';

        this.setLongPress();
        this.databaseService.stopLoading();
      },
    });
  }

  async filterTrees(filterString: any): Promise<void> {
    if (filterString) {
      filterString = filterString.toLowerCase();
      this.treesList = (
        await this.databaseService.getTreesList(this.treeGroupId)
      ).filter((x) => x.title.toLowerCase().includes(filterString));
    } else {
      this.treesList = await this.databaseService.getTreesList(
        this.treeGroupId
      );
    }
  }

  cardClicked(id: string | undefined | null): void {
    this.selectedTreeId = id ?? '';
    this.isActionSheetOpen = true;
  }

  setLongPress(): void {
    const cardElements = document.querySelectorAll('ion-card');
    for (let i = 0; i < cardElements.length; i++) {
      const hammer = new Hammer(cardElements[i]!);

      hammer.get('press').set({ time: 500 });
      hammer.on('press', () => {
        const id = cardElements[i]?.getAttribute('id');
        return this.cardClicked(id);
      });
    }
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

    this.treesList = await this.databaseService.getTreesList(this.treeGroupId);
    this.setLongPress();
  }

  getImage(tree: Tree): BoomkykPhoto | undefined {
    const images = tree.images.filter((x) => x.type === ImageType.Overview);
    if (images.length > 0) return images[0];
    return undefined;
  }

  async deleteClicked(): Promise<void> {
    await this.databaseService.openDeleteTreeAlert(this.selectedTreeId);
    this.treesList = await this.databaseService.getTreesList(this.treeGroupId);
    this.setLongPress();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
