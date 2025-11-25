import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Guid } from 'guid-typescript';
import { ItemImageComponent } from 'src/app/components/create/item-image/item-image.component';
import { ItemMapComponent } from 'src/app/components/create/item-map/item-map.component';
import { SelectItemComponent } from 'src/app/components/create/select-item/select-item.component';
import { VoiceComponent } from 'src/app/components/create/voice/voice.component';
import { AudioRecording } from 'src/app/models/audio-recording.interface';
import { NewCategory, NewCategoryItem } from 'src/app/models/new-category.interface';
import { NewImage } from 'src/app/models/new-image.interface';
import { Pin } from 'src/app/models/pin.interface';
import { RecordingService } from 'src/app/services/legacy/recording.service';
import { NewCategoryService } from 'src/app/services/new-category.service';

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
    CommonModule,
    FormsModule,
    SelectItemComponent,
    ItemImageComponent,
    ItemMapComponent,
    VoiceComponent,
    ReactiveFormsModule,
  ],
})
export class CreatePage implements OnInit {
  private categoryService = inject(NewCategoryService);
  protected recordingService = inject(RecordingService);

  isEdit: boolean = false;
  selectedCategory = signal<NewCategory | undefined>(undefined);
  selectedCategoryItem = signal<NewCategoryItem | undefined>(undefined);

  mapPins = signal<Pin[]>([]);
  images = signal<NewImage[]>([]);
  audioFiles = signal<AudioRecording[]>([]);

  itemFormGroup = new FormGroup({
    type: new FormControl<NewCategory | undefined>(undefined, [Validators.required]),
    typeValue: new FormControl('', [Validators.required]),
    parent: new FormControl<NewCategory | undefined>(undefined, [Validators.required]),
  });

  constructor() {}

  async ngOnInit() {
    let categoryItems = await this.categoryService.getCategoryItems();
    if (categoryItems && categoryItems.length > 0) {
      categoryItems = categoryItems?.sort((a, b) => a.level - b.level);
      this.selectedCategoryItem.set(categoryItems[0]);
    }

    let categories = await this.categoryService.getCategories();
    if (categories && categories.length > 0) {
      categories = categories?.sort((a, b) => a.level - b.level);
      this.selectedCategory.set(categories[0]);
    }
  }

  onSubmit(): void {
    if (this.itemFormGroup.valid) {
      const newItem: NewCategoryItem = {
        id: Guid.create(),
        name: this.itemFormGroup.value.typeValue!,
        level: this.itemFormGroup.value.type!.level,
        parentId: this.itemFormGroup.value.parent?.id,
        notes: this.selectedCategoryItem()?.notes!,
        newCategoryId: this.selectedCategory()?.id!,
        audioFileIds: this.audioFiles().map((recording) => recording.id),
        imageIds: this.images().map((image) => image.id),
        highlightImageId: this.images().find((image) => image.isHighlight)?.id,
        pinIds: this.mapPins().map((pin) => pin.id),
      };
      console.log(newItem);
      //const type = this.categories.find((c) => c.level === this.itemFormGroup.value.type?.level);
      //   const item: Item = {
      //     id: Guid.create(),
      //     title: this.itemFormGroup.value.typeValue!,
      //     type: this.itemFormGroup.value.type!,
      //     groupId: this.itemFormGroup.value.parent!,
      //     images: this.images(),
      //     voiceNotes: this.recordingService.recordings(),
      //     locations: this.mapPins(),
      //   };
      //   this.databaseService.saveTree(item);
    } else {
      console.log(this.itemFormGroup.controls['parent']);
    }
  }
}
