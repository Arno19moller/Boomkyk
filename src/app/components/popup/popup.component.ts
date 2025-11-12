import { Component, effect, EventEmitter, input, model, Output } from '@angular/core';
import { IonAlert } from '@ionic/angular/standalone';
import type { OverlayEventDetail } from '@ionic/core';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss'],
  standalone: true,
  imports: [IonAlert],
})
export class PopupComponent {
  isAlertOpen = model.required<boolean>();
  heading = input.required<string>();
  subHeading = input<string>();
  body = input<string>();
  buttonType = input.required<'confirm'>();

  @Output() popupClosed: EventEmitter<string> = new EventEmitter<string>();

  protected alertButtons: {}[] = [];
  private confirmButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Alert canceled');
      },
    },
    {
      text: 'Confirm',
      role: 'confirm',
      handler: () => {
        console.log('Alert confirmed');
      },
    },
  ];

  constructor() {
    effect(() => {
      if (this.buttonType() === 'confirm') this.alertButtons = this.confirmButtons;
    });
  }

  setOpen(event: CustomEvent<OverlayEventDetail>) {
    this.isAlertOpen.set(false);
    this.popupClosed.emit(event.detail.role);
  }
}
