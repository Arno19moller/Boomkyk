import { Component, effect, EventEmitter, input, model, OnInit, Output } from '@angular/core';
import { IonActionSheet } from '@ionic/angular/standalone';
import type { OverlayEventDetail } from '@ionic/core';

@Component({
  standalone: true,
  selector: 'app-action-sheet',
  templateUrl: './action-sheet.component.html',
  styleUrls: ['./action-sheet.component.scss'],
  imports: [IonActionSheet],
})
export class PhotoActionSheetComponent implements OnInit {
  @Output() closed: EventEmitter<string> = new EventEmitter();

  header: string = '';

  type = input<'upload' | 'delete'>('delete');
  isOpen = model.required<boolean>();
  buttons: any = [];
  uploadPhotobuttons = [
    {
      text: 'From Gallery',
      role: 'destructive',
      icon: 'image',
      data: {
        action: 'gallery',
      },
    },
    {
      text: 'Take Picture',
      role: 'destructive',
      icon: 'camera',
      data: {
        action: 'camera',
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
    },
  ];

  deleteButtons = [
    {
      text: 'Delete',
      role: 'destructive',
      icon: 'trash',
      data: {
        action: 'delete',
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
    },
  ];

  constructor() {
    effect(() => {
      const type = this.type();
      this.header = type === 'upload' ? 'Upload Images' : 'Confirm Delete';
      this.buttons = type === 'delete' ? this.deleteButtons : this.uploadPhotobuttons;
    });
  }

  ngOnInit() {}

  actionSheetClosed(event: CustomEvent<OverlayEventDetail>): void {
    this.closed.emit(event.detail.data?.action);
    this.isOpen.set(false);
  }
}
