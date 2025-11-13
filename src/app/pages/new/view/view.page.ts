import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StatusBar } from '@capacitor/status-bar';
import { NavController } from '@ionic/angular';
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
export class ViewPage implements OnInit {
  private navController = inject(NavController);

  imgHeight: number = 45;
  notes: string = 'asdasds';
  isModalOpen: boolean = true;

  constructor() {}

  async ngOnInit() {
    await StatusBar.setOverlaysWebView({ overlay: true });
  }

  modalChange(event: any): void {
    this.imgHeight = 105 - +event.detail.breakpoint * 100;
  }

  async goBack() {
    await StatusBar.setOverlaysWebView({ overlay: false });
    this.navController.navigateBack('home');
  }
}
