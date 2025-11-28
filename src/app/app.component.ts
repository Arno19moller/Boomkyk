import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonLoading, IonRouterOutlet, IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  addCircleOutline,
  arrowBack,
  arrowBackOutline,
  camera,
  cameraOutline,
  checkmark,
  chevronForwardOutline,
  close,
  closeCircleOutline,
  create,
  ellipseOutline,
  ellipsisVerticalOutline,
  expand,
  filterCircleOutline,
  image,
  informationCircleOutline,
  leaf,
  locationOutline,
  mapOutline,
  mic,
  pause,
  play,
  save,
  square,
  trash,
  triangle,
} from 'ionicons/icons';
import { DatabaseService } from './services/legacy/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonLoading, IonToast],
})
export class AppComponent implements OnInit {
  public databaseService = inject(DatabaseService);

  constructor() {
    addIcons({
      add,
      addCircleOutline,
      arrowBack,
      arrowBackOutline,
      camera,
      cameraOutline,
      checkmark,
      chevronForwardOutline,
      close,
      closeCircleOutline,
      create,
      ellipseOutline,
      ellipsisVerticalOutline,
      expand,
      filterCircleOutline,
      image,
      informationCircleOutline,
      leaf,
      locationOutline,
      mapOutline,
      mic,
      pause,
      play,
      save,
      square,
      trash,
      triangle,
    });
  }

  async ngOnInit() {
    this.databaseService.addNursery();
  }
}
