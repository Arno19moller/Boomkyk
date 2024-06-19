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

  @ViewChild('longPressElement') longPressElement: ElementRef | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public databaseService: DatabaseService,
    private actionsService: ActionsService
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

  setLongPress(): void {
    const cardElements = document.querySelectorAll('ion-card');
    for (let i = 0; i < cardElements.length; i++) {
      const hammer = new Hammer(cardElements[i]!);

      hammer.get('press').set({ time: 500 });
      hammer.on('press', async () => {
        const id = cardElements[i]?.getAttribute('id');
        return await this.cardClicked(id);
      });
    }
  }

  async cardClicked(id: string | undefined | null): Promise<void> {
    await this.actionsService.openEditOrDeleteModal(id ?? '');
    this.treesList = await this.databaseService.getTreesList(this.treeGroupId);
  }

  createNewClicked(): void {
    this.actionsService.selectedTreeType = TreeType.Individual;
    this.router.navigate(['/create']);
  }

  getImage(tree: Tree): BoomkykPhoto | undefined {
    const images = tree.images.filter((x) => x.type === ImageType.Overview);
    if (images.length > 0) return images[0];
    return undefined;
  }

  ionViewWillLeave(): void {
    this.treesList = [];
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
