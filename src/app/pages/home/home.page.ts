import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonHeader,
  IonIcon,
  IonImg,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { BottomSheetComponent } from '../../components/bottom-sheet/bottom-sheet.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonFabList,
    IonFabButton,
    IonFab,
    IonSearchbar,
    IonIcon,
    IonButton,
    IonButtons,
    IonImg,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    RouterModule,
    FormsModule,
    BottomSheetComponent,
  ],
})
export class HomePage implements OnInit {
  protected isOpen = signal<boolean>(false);

  constructor() {}

  ngOnInit() {}

  async filterGroups(filterString: any): Promise<void> {
    // if (filterString) {
    //   filterString = filterString.toLowerCase();
    //   this.groups = (await this.databaseService.getTreesByType(TreeType.Family)).filter((x) =>
    //     x.title.toLowerCase().includes(filterString),
    //   );
    // } else {
    //   this.groups = await this.databaseService.getTreesByType(TreeType.Family);
    // }
  }
}
