import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StatusBar } from '@capacitor/status-bar';
import { NavController, ViewWillLeave } from '@ionic/angular';
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
export class ViewPage implements OnInit, ViewWillLeave {
  private navController = inject(NavController);

  @ViewChild(IonModal) modal!: IonModal;

  imgHeight: number = 37;
  notes: string = 'asdasds';
  isModalOpen: boolean = true;

  constructor() {}

  async ngOnInit() {
    await StatusBar.setOverlaysWebView({ overlay: true });
  }

  modalChange(event: any): void {
    this.imgHeight = 101.5 - +event.detail.breakpoint * 100;
  }

  async goBack() {
    await StatusBar.setOverlaysWebView({ overlay: false });
    this.navController.navigateBack('home');
  }

  ionViewWillLeave() {
    this.modal.dismiss();
    StatusBar.setOverlaysWebView({ overlay: false });
  }
}
