import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StatusBar } from '@capacitor/status-bar';
import { NavController, Platform, ViewWillLeave } from '@ionic/angular';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal } from '@ionic/angular/standalone';
import { Guid } from 'guid-typescript';
import { VoiceComponent } from 'src/app/components/create/voice/voice.component';
import { MapComponent } from 'src/app/components/map/map.component';
import { AudioRecording } from 'src/app/models/audio-recording.interface';
import { NewCategoryItem } from 'src/app/models/new-category.interface';
import { NewImage } from 'src/app/models/new-image.interface';
import { Pin } from 'src/app/models/pin.interface';
import { ItemsService } from 'src/app/services/items.service';
import { MapService } from 'src/app/services/map.service';
import { NewAudioService } from 'src/app/services/new-audio.service';
import { NewCategoryService } from 'src/app/services/new-category.service';
import { NewImageService } from 'src/app/services/new-image.service';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-view',
  templateUrl: './view.page.html',
  styleUrls: ['./view.page.scss'],
  standalone: true,
  imports: [
    IonModal,
    IonContent,
    IonHeader,
    IonIcon,
    IonButton,
    IonButtons,
    MapComponent,
    VoiceComponent,
    CommonModule,
    FormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ViewPage implements OnInit, ViewWillLeave, AfterViewInit {
  private navController = inject(NavController);
  private cdr = inject(ChangeDetectorRef);
  private platform = inject(Platform);
  private route = inject(ActivatedRoute);
  private itemsService = inject(ItemsService);
  private imageService = inject(NewImageService);
  private mapService = inject(MapService);
  private audioService = inject(NewAudioService);
  private categoryService = inject(NewCategoryService);

  @ViewChild(IonModal) modal!: IonModal;

  imgHeight: number = 37;
  isModalOpen: boolean = true;
  images = signal<NewImage[]>([]);
  selectedItem = signal<NewCategoryItem | undefined>(undefined);
  pins = signal<Pin[]>([]);
  audioFiles = signal<AudioRecording[]>([]);
  private animationFrameId: number | undefined;

  constructor() {}

  async ngOnInit() {
    if (this.platform.is('hybrid')) {
      await StatusBar.setOverlaysWebView({ overlay: true });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const item = await this.itemsService.getItemByGuid(Guid.parse(id));

      await this.setSelectedItem(item);
      await this.setPins(item);
      await this.setAudioFiles(item);
      await this.setHierarchy(item);
    }
  }

  ngAfterViewInit() {
    const modalElement = this.modal['el'];

    setTimeout(() => {
      const wrapper = modalElement.shadowRoot?.querySelector('.modal-wrapper');

      if (wrapper) {
        const update = () => {
          const rect = wrapper.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const topPercentage = (rect.top / windowHeight) * 100;

          if (Math.abs(this.imgHeight - topPercentage) > 0.1) {
            this.imgHeight = topPercentage + 1;
            this.cdr.detectChanges();
          }

          this.animationFrameId = requestAnimationFrame(update);
        };

        update();
      }
    }, 500);
  }

  private async setSelectedItem(item: NewCategoryItem | undefined) {
    if (item && item.imageIds && item.imageIds.length > 0) {
      const images = await this.imageService.getImagesByGuids(item.imageIds);
      this.images.set(images);
      this.selectedItem.set(item);
    }
  }

  private async setPins(item: NewCategoryItem | undefined) {
    if (item && item.pinIds && item.pinIds.length > 0) {
      const pins = await this.mapService.getPinsByGuid(item.pinIds);
      this.pins.set(pins);
    }
  }

  private async setAudioFiles(item: NewCategoryItem | undefined) {
    if (item && item.audioFileIds && item.audioFileIds.length > 0) {
      const audioFiles = await this.audioService.getAudioFilesByGuid(item.audioFileIds);
      this.audioFiles.set(audioFiles);
    }
  }

  private async setHierarchy(item: NewCategoryItem | undefined) {
    if (item == undefined) return;

    var hierarchy = await this.categoryService.getHierarchy(item);
    item.categoryHierarchy = hierarchy;
  }

  async goBack() {
    if (this.platform.is('hybrid')) {
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
    this.navController.navigateBack('home');
  }

  ionViewWillLeave() {
    this.modal.dismiss();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.platform.is('hybrid')) {
      StatusBar.setOverlaysWebView({ overlay: false });
    }
  }
}
