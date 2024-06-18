import { Component, EnvironmentInjector, inject } from '@angular/core';
import {
  IonIcon,
  IonLabel,
  IonLoading,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
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
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonLoading],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

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
    });
  }
}
