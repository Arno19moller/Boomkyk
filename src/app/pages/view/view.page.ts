import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StatusBar } from '@capacitor/status-bar';
import { NavController, Platform, ViewWillLeave } from '@ionic/angular';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal } from '@ionic/angular/standalone';
import { MapComponent } from 'src/app/components/map/map.component';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-view',
  templateUrl: './view.page.html',
  styleUrls: ['./view.page.scss'],
  standalone: true,
  imports: [IonModal, IonContent, IonHeader, IonIcon, IonButton, IonButtons, MapComponent, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ViewPage implements OnInit, ViewWillLeave, AfterViewInit {
  private navController = inject(NavController);
  private cdr = inject(ChangeDetectorRef);
  private platform = inject(Platform);

  @ViewChild(IonModal) modal!: IonModal;

  imgHeight: number = 37;
  notes: string = 'asdasds';
  isModalOpen: boolean = true;
  private animationFrameId: number | undefined;

  constructor() {}

  async ngOnInit() {
    if (this.platform.is('hybrid')) {
      await StatusBar.setOverlaysWebView({ overlay: true });
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
