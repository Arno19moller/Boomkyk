import { Component } from '@angular/core';
import { IonApp, IonLoading, IonRouterOutlet, IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  arrowBack,
  camera,
  checkmark,
  close,
  create,
  ellipse,
  image,
  leaf,
  square,
  trash,
  triangle,
} from 'ionicons/icons';
import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonLoading, IonToast],
})
export class AppComponent {
  constructor(public databaseService: DatabaseService) {
    addIcons({
      triangle,
      ellipse,
      square,
      camera,
      image,
      trash,
      close,
      leaf,
      arrowBack,
      create,
      checkmark,
      addCircleOutline,
    });
  }
}
