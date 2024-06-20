import { LocationStrategy } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { TreeType } from 'src/app/models/tree-type.enum';
import { Tree } from 'src/app/models/tree.interface';
import { ActionsService } from 'src/app/services/actions.service';
import { DatabaseService } from 'src/app/services/database.service';

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
})
export class TreeListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();
  private treeGroupId: string | undefined = undefined;

  public treesList: Tree[] = [];
  public title: string = '';
  public currentTreeType: number = 1;
  public TreeType = TreeType;
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

  @ViewChild('longPressElement') longPressElement: ElementRef | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public databaseService: DatabaseService,
    private actionsService: ActionsService,
    private locationStrategy: LocationStrategy
  ) {}

  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: async (param) => {
        this.databaseService.startLoading('Loading Trees');
        this.treeGroupId = param['id'];
        this.currentTreeType = param['type'] as TreeType;

        await this.databaseService.setSelectedTreeGroup(param['id']);
        this.treesList = await this.databaseService.getTreesList(
          param['type'] as TreeType,
          param['id']
        );
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
        await this.databaseService.getTreesList(
          TreeType.Genus,
          this.treeGroupId
        )
      ).filter((x) => x.title.toLowerCase().includes(filterString));
    } else {
      this.treesList = await this.databaseService.getTreesList(
        TreeType.Genus,
        this.treeGroupId
      );
    }
    this.setLongPress();
  }

  setLongPress(): void {
    const cardElements = document.querySelectorAll('ion-card');
    for (let i = 0; i < cardElements.length; i++) {
      const hasLongPress = cardElements[i]!.getAttribute('longPress');

      // Only assign long press when new
      if (hasLongPress == null) {
        cardElements[i]!.setAttribute('longPress', 'true');
        const hammer = new Hammer(cardElements[i]!);

        hammer.get('press').set({ time: 500 });
        hammer.on('press', async () => {
          const id = cardElements[i]?.getAttribute('id');
          return await this.cardClicked(id);
        });
      }
    }
  }

  async cardClicked(id: string | undefined | null): Promise<void> {
    await this.actionsService.openEditOrDeleteModal(id ?? '');
    this.treesList = await this.databaseService.getTreesList(
      TreeType.Genus,
      this.treeGroupId
    );
  }

  createNewClicked(): void {
    this.actionsService.selectedTreeType = TreeType.Genus;
    this.router.navigate(['/create']);
  }

  getImage(tree: Tree): BoomkykPhoto | undefined {
    const images = tree.images!.filter((x) => x.type === ImageType.Overview);
    if (images.length > 0) return images[0];
    return undefined;
  }

  backClicked(): void {
    this.locationStrategy.back();
  }

  ionViewWillLeave(): void {
    this.treesList = [];
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
