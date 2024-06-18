import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ModalController } from '@ionic/angular';
import {
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
  IonLabel,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { ImageType } from 'src/app/models/image-type.enum';
import { BoomkykPhoto } from 'src/app/models/photo.interface';
import { Tree } from 'src/app/models/tree.interface';
import { DatabaseService } from 'src/app/services/database.service';
import { Tab2Page } from 'src/app/tab2/tab2.page';
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
    IonSegment,
    IonSegmentButton,
    RouterModule,
    CommonModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [ModalController],
})
export class TreeViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

  public tree: Tree | undefined = undefined;
  public overviewImages: BoomkykPhoto[] = [];
  public leafImages: BoomkykPhoto[] = [];
  public barkImages: BoomkykPhoto[] = [];
  public fruitImages: BoomkykPhoto[] = [];
  public flowerImages: BoomkykPhoto[] = [];
  public overviewDescription: string = '';
  public leafDescription: string = '';
  public barkDescription: string = '';
  public fruitDescription: string = '';
  public flowerDescription: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    public databaseService: DatabaseService,
    private modalController: ModalController
  ) {
    register();
  }

  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: async (param) => {
        this.databaseService.startLoading('Loading Tree');
        await this.loadTree(param['id']);
        this.databaseService.stopLoading();
      },
    });
  }

  async openEditModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: Tab2Page,
      componentProps: {
        newTree: this.tree,
        showBackButton: true,
      },
    });

    await modal.present();
    await modal.onDidDismiss();
    await this.loadTree(this.tree?.id['value']);
  }

  private async loadTree(id: string): Promise<void> {
    this.tree = await this.databaseService.getSelectedTree(id);

    this.overviewImages =
      this.tree?.images.filter((x) => x.type === ImageType.Overview) ?? [];
    this.leafImages =
      this.tree?.images.filter((x) => x.type === ImageType.Leaves) ?? [];
    this.barkImages =
      this.tree?.images.filter((x) => x.type === ImageType.Bark) ?? [];
    this.fruitImages =
      this.tree?.images.filter((x) => x.type === ImageType.Fruit) ?? [];
    this.flowerImages =
      this.tree?.images.filter((x) => x.type === ImageType.Flower) ?? [];

    if (this.tree?.treeInfo) {
      this.overviewDescription = this.tree.treeInfo.overview.replace(
        /\n/g,
        '<br>'
      );
      this.leafDescription = this.tree.treeInfo.leaves.replace(/\n/g, '<br>');
      this.barkDescription = this.tree.treeInfo.bark.replace(/\n/g, '<br>');
      this.fruitDescription = this.tree.treeInfo.fruit.replace(/\n/g, '<br>');
      this.flowerDescription = this.tree.treeInfo.flower.replace(/\n/g, '<br>');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
