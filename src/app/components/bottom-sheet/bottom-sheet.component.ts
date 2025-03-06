import { Component, model, OnInit } from '@angular/core';
import { IonActionSheet, IonButton } from '@ionic/angular/standalone';
import type { OverlayEventDetail } from '@ionic/core';

@Component({
  standalone: true,
  selector: 'app-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss'],
  imports: [IonActionSheet, IonButton],
})
export class BottomSheetComponent implements OnInit {
  isOpen = model<boolean>(false);
  public actionSheetButtons = [
    {
      text: 'Delete',
      role: 'destructive',
      data: {
        action: 'delete',
      },
    },
    {
      text: 'Share',
      data: {
        action: 'share',
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
      data: {
        action: 'cancel',
      },
    },
  ];

  constructor() {}

  ngOnInit() {}

  logResult(event: CustomEvent<OverlayEventDetail>) {
    // console.log(JSON.stringify(event.detail, null, 2));
    this.isOpen.set(false);
  }
}
