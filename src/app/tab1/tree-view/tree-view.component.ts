import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
} from '@angular/core';
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
  IonLabel,
  IonRadioGroup,
  IonRadio,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { Tree } from 'src/app/models/tree.interface';
import { DatabaseService } from 'src/app/services/database.service';
import { register } from 'swiper/element/bundle';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
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
    IonLabel,
    IonRadioGroup,
    IonRadio,
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TreeViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

  public tree: Tree | undefined = undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    public databaseService: DatabaseService
  ) {
    register();
  }

  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: async (param) => {
        this.tree = await this.databaseService.getSelectedTree(param['id']);
        console.log(this.tree);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
