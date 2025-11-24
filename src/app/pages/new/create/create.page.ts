import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonModal,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { MapComponent } from 'src/app/components/map/map.component';
import { PopupComponent } from 'src/app/components/popup/popup.component';
import { LongPressDirective } from 'src/app/directives/long-press.directive';
import { CategoryStructure, CategoryStructureItem } from 'src/app/models/category-structure.interface';
import { Level } from 'src/app/models/level.interface';
import { Pin } from 'src/app/models/pin.interface';
import { CategoryService } from 'src/app/services-new/category.service';
import { RecordingService } from 'src/app/services/recording.service';
import { PhotoActionSheetComponent } from '../../../components/action-sheet/action-sheet.component';
import { ItemImageComponent } from '../../../components/create/item-image/item-image.component';
import { SelectItemComponent } from '../../../components/create/select-item/select-item.component';
import { VoiceComponent } from '../../../components/create/voice/voice.component';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonModal,
    CommonModule,
    FormsModule,
    PhotoActionSheetComponent,
    SelectItemComponent,
    ItemImageComponent,
    VoiceComponent,
    MapComponent,
    IonCol,
    IonRow,
    IonGrid,
    IonCard,
    IonCardHeader,
    IonCardContent,
    PopupComponent,
    ReactiveFormsModule,
    LongPressDirective,
  ],
})
export class CreatePage implements OnInit {
  private categoryService = inject(CategoryService);
  protected recordingService = inject(RecordingService);

  isEdit: boolean = false;
  showMapModal: boolean = false;
  confirmDeleteBody: string = '';
  voiceDuration: number = 0;
  categories: CategoryStructure[] = [];
  actionSheetType: 'action' | 'upload' | 'delete' = 'upload';

  openConfirmDelete = signal<boolean>(false);
  isActionSheetOpen = signal<boolean>(false);
  selectedCategory = signal<CategoryStructure | undefined>(undefined);
  selectedCategoryItem = signal<CategoryStructureItem | undefined>(undefined);
  images = signal<{ format: string; webPath: string; isHighlight: boolean }[]>([]);
  mapPins = signal<Pin[]>([]);
  selectedPin: Pin | undefined = undefined;

  itemFormGroup = new FormGroup({
    type: new FormControl<Level | undefined>(undefined, [Validators.required]),
    typeValue: new FormControl('', [Validators.required]),
    newTypeValue: new FormControl(''),
    parent: new FormControl<Level | undefined>(undefined, [Validators.required]),
  });

  constructor() {}

  ngOnInit() {
    this.categoryService.getCategories().then((categories) => {
      this.categories = [];

      if (categories && categories.length > 0) {
        categories = categories?.sort((a, b) => a.level - b.level);
        this.categories = categories;
        this.selectedCategory.set(categories[0]);
      }
    });
  }

  actionSheetClosed(event: any): void {
    if (event === 'delete' && this.selectedPin != undefined) {
      this.removePinClicked(this.selectedPin);
    } else if (event === 'edit' && this.selectedPin != undefined) {
      this.pinDoubleClick(this.selectedPin);
    }
  }

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

  onSubmit(): void {
    console.log(this.itemFormGroup.valid);
  }
}
