import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
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
} from '@ionic/angular/standalone';
import { Guid } from 'guid-typescript';
import { Subject, takeUntil } from 'rxjs';
import { Tree } from 'src/app/models/tree.interface';
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
    RouterModule,
  ],
})
export class TreeListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();
  private treeGroupId: string | undefined = undefined;

  public treesList: Tree[] = [];
  public title: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    public databaseService: DatabaseService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: async (param) => {
        this.treeGroupId = param['id'];
        await this.databaseService.setSelectedTreeGroup(param['id']);
        this.treesList = await this.databaseService.getTreesList(param['id']);
        this.title =
          (await this.databaseService.getSelectedTree(param['id']))?.title ??
          'Not Found';
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

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
