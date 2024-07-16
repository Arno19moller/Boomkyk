import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ActionSheetController, AlertController, Gesture, GestureController, ModalController } from '@ionic/angular';
import {
  IonActionSheet,
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
  IonImg,
  IonRow,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { TreeType } from 'src/app/models/tree-type.enum';
import { Tree } from 'src/app/models/tree.interface';
import { ActionsService } from 'src/app/services/actions.service';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-tree-families',
  templateUrl: './tree-families.component.html',
  styleUrls: ['./tree-families.component.scss'],
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
    IonButtons,
    IonIcon,
    IonImg,
    IonGrid,
    IonRow,
    IonCol,
  ],
  providers: [ModalController, AlertController, ActionSheetController],
})
export class TreeFamiliesComponent implements OnInit, OnDestroy {
  private selectedTreeId: string = '';
  private destroy$ = new Subject();
  private gestures: Gesture[] = [];

  public nursery: Tree | undefined = undefined;
  public TreeType = TreeType;
  public groups: Tree[] = [];
  public pastelColors: string[] = [
    'rgba(137, 144, 179, 0.6)', // Pigeon Blue
    'rgba(255, 211, 196, 0.6)', // Peach
    'rgba(222, 227, 255, 0.6)', // Thistle
    'rgba(222, 255, 196, 0.6)', // Pastel Green
    'rgba(160, 179, 146, 0.6)', // Sage Green
    'rgba(247, 173, 195, 0.6)', // Cherry Blossom Pink
    'rgba(252, 197, 217, 0.6)', // Fairy Tale Pink
    'rgba(250, 221, 227, 0.6)', // Mimi Pink
    'rgba(247, 245, 237, 0.6)', // Floral White
    'rgba(114, 221, 247, 0.6)', // Sky Blue
  ];

  constructor(
    private databaseService: DatabaseService,
    private actionsServie: ActionsService,
    private activeRoute: ActivatedRoute,
    private gestureCtrl: GestureController,
  ) {}

  async ngOnInit(): Promise<void> {
    this.nursery = await this.databaseService.getTreeByName('Nursery');

    this.activeRoute.url.pipe(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        this.databaseService.startLoading('Loading Tree Groups');
        this.groups = await this.databaseService.getTreesByType(TreeType.Family);
        this.setLongPress();
        this.databaseService.stopLoading();
      },
    });
  }

  setLongPress(): void {
    this.gestures.map((gesture) => gesture.destroy());
    this.gestures = [];
    setTimeout(() => {
      const cardElements = document.querySelectorAll('ion-card');

      for (let i = 0; i < cardElements.length; i++) {
        const hasLongPress = cardElements[i]!.getAttribute('longPress');
        const isIdNull = cardElements[i]!.getAttribute('id') == null;

        // Only assign long press when new
        if (hasLongPress == null && !isIdNull) {
          cardElements[i]!.setAttribute('longPress', 'true');

          const hammer = new Hammer(cardElements[i]!);

          hammer.get('press').set({ time: 500 });
          hammer.on('press', async () => {
            const id = cardElements[i]!.getAttribute('id');
            return await this.cardClicked(id);
          });
        }
      }
    }, 200);
  }

  async cardClicked(id: string | undefined | null): Promise<void> {
    this.selectedTreeId = id ?? '';
    await this.actionsServie.openLongPressModal(this.selectedTreeId);
    this.groups = await this.databaseService.getTreesByType(TreeType.Family);
    this.setLongPress();
  }

  async filterGroups(filterString: any): Promise<void> {
    if (filterString) {
      filterString = filterString.toLowerCase();
      this.groups = (await this.databaseService.getTreesByType(TreeType.Family)).filter((x) =>
        x.title.toLowerCase().includes(filterString),
      );
    } else {
      this.groups = await this.databaseService.getTreesByType(TreeType.Family);
    }
    this.setLongPress();
  }

  ngOnDestroy(): void {
    this.destroy$.next(undefined);
    this.destroy$.complete();
  }
}
