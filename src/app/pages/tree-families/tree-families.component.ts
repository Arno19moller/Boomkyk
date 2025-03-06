import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
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
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    RouterModule,
    IonSearchbar,
    IonButtons,
    IonIcon,
    IonImg,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOption,
    IonItemOptions,
  ],
  providers: [ModalController, AlertController, ActionSheetController],
})
export class TreeFamiliesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

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
    private actionsService: ActionsService,
    private activeRoute: ActivatedRoute,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.nursery = await this.databaseService.getTreeByName('Nursery');

    this.activeRoute.url.pipe(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        this.databaseService.startLoading('Loading Tree Groups');
        this.groups = await this.databaseService.getTreesByType(TreeType.Family);
        this.databaseService.stopLoading();
      },
    });
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
  }

  editClicked(group: Tree) {
    this.actionsService.selectedTree = group;
    this.router.navigate(['/create']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(undefined);
    this.destroy$.complete();
  }
}
