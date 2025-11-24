import { CommonModule } from '@angular/common';
import { Component, model, OnInit, signal } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCol, IonGrid, IonIcon, IonModal, IonRow } from '@ionic/angular/standalone';
import { PhotoActionSheetComponent } from 'src/app/components/action-sheet/action-sheet.component';
import { MapComponent } from 'src/app/components/map/map.component';
import { PopupComponent } from 'src/app/components/popup/popup.component';
import { LongPressDirective } from 'src/app/directives/long-press.directive';
import { Pin } from 'src/app/models/legacy/pin.interface';

@Component({
  standalone: true,
  selector: 'app-item-map',
  templateUrl: './item-map.component.html',
  styleUrls: ['./item-map.component.scss'],
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonModal,
    MapComponent,
    PhotoActionSheetComponent,
    PopupComponent,
    LongPressDirective,
  ],
})
export class ItemMapComponent implements OnInit {
  mapPins = model.required<Pin[]>();

  protected showMapModal: boolean = false;
  protected actionSheetType: 'action' | 'upload' | 'delete' = 'upload';
  protected isActionSheetOpen = signal<boolean>(false);
  protected openConfirmDelete = signal<boolean>(false);
  protected confirmDeleteBody: string = '';
  protected selectedPin: Pin | undefined = undefined;

  constructor() {}

  ngOnInit() {}

  mapModalClosed(pins: Pin[]) {
    this.showMapModal = false;
    this.selectedPin = undefined;
    if (pins == undefined) return;

    this.mapPins.update(() => {
      return pins;
    });
  }

  removePinClicked(pin: Pin): void {
    this.selectedPin = pin;
    this.openConfirmDelete.set(true);
    this.confirmDeleteBody = 'Are you sure you want to delete this pin?';
  }

  deletePopupClosed(role: string) {
    if (role === 'confirm') {
      this.mapPins.update((pins) => {
        const index = pins.indexOf(this.selectedPin!);
        if (index >= 0) {
          pins.splice(index);
        }
        return pins;
      });
    }
  }

  pinDoubleClick(pin: Pin) {
    this.selectedPin = pin;
    this.showMapModal = true;
  }

  pinLongPress(pin: Pin) {
    this.selectedPin = pin;
    this.actionSheetType = 'action';
    this.isActionSheetOpen.set(true);
  }

  actionSheetClosed(event: any): void {
    if (event === 'delete' && this.selectedPin != undefined) {
      this.removePinClicked(this.selectedPin);
    } else if (event === 'edit' && this.selectedPin != undefined) {
      this.pinDoubleClick(this.selectedPin);
    }
  }
}
