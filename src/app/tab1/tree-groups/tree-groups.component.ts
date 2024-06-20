import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  ModalController,
} from '@ionic/angular';
import {
  IonActionSheet,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { Tree } from 'src/app/models/tree.interface';
import { ActionsService } from 'src/app/services/actions.service';
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
    IonButtons,
    IonIcon,
  ],
  providers: [ModalController, AlertController, ActionSheetController],
})
export class TreeGroupsComponent implements OnInit, OnDestroy {
  private selectedTreeId: string = '';
  private destroy$ = new Subject();

  public groups: Tree[] = [];

  constructor(
    private databaseService: DatabaseService,
    private actionsServie: ActionsService,
    private activeRoute: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.activeRoute.url.pipe(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        this.databaseService.startLoading('Loading Tree Groups');
        this.initialiseLongPress(await this.databaseService.getTreeGroups());
        this.databaseService.stopLoading();
      },
    });
  }

  initialiseLongPress(groups: Tree[]): void {
    this.groups = groups;
    setTimeout(() => {
      const cardElements = document.querySelectorAll('ion-card');

      for (let i = 0; i < cardElements.length; i++) {
        const hasLongPress = cardElements[i]!.getAttribute('longPress');

        // Only assign long press when new
        if (hasLongPress == null) {
          const id = cardElements[i]!.getAttribute('id');
          cardElements[i]!.setAttribute('longPress', 'true');

          const hammer = new Hammer(cardElements[i]!);

          hammer.get('press').set({ time: 500 });
          hammer.on('press', async () => {
            return await this.cardClicked(id);
          });
        }
      }
    }, 200);
  }

  async cardClicked(id: string | undefined | null): Promise<void> {
    this.selectedTreeId = id ?? '';
    await this.actionsServie.openEditOrDeleteModal(this.selectedTreeId);
    this.initialiseLongPress(await this.databaseService.getTreeGroups());
  }

  getDescription(tree: Tree): string {
    return tree.description.replace(/\n/g, '<br>');
  }

  async filterGroups(filterString: any): Promise<void> {
    if (filterString) {
      filterString = filterString.toLowerCase();
      this.initialiseLongPress(
        (await this.databaseService.getTreeGroups()).filter((x) =>
          x.title.toLowerCase().includes(filterString)
        )
      );
    } else {
      this.initialiseLongPress(
        (this.groups = await this.databaseService.getTreeGroups())
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(undefined);
    this.destroy$.complete();
  }
}
