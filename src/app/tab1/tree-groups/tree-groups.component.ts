import { Component, Input } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
} from '@ionic/angular/standalone';
import { DatabaseService } from '../../services/database.service';
import { RouterModule } from '@angular/router';
import { Tree } from 'src/app/models/tree.interface';

@Component({
  selector: 'app-tree-groups',
  templateUrl: './tree-groups.component.html',
  styleUrls: ['./tree-groups.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonCardSubtitle,
    RouterModule,
  ],
})
export class TreeGroupsComponent {
  @Input() groups: Tree[] = [];

  constructor(public database: DatabaseService) {}
}
