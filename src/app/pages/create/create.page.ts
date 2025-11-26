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
  NavController,
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
import { ItemsService } from 'src/app/services/items.service';
import { MapService } from 'src/app/services/map.service';
import { NewAudioService } from 'src/app/services/new-audio.service';
import { NewCategoryService } from 'src/app/services/new-category.service';
import { NewImageService } from 'src/app/services/new-image.service';

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
  private itemsService = inject(ItemsService);
  private mapService = inject(MapService);
  private audioService = inject(NewAudioService);
  private categoryService = inject(NewCategoryService);
  private imageService = inject(NewImageService);
  private navController = inject(NavController);

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

  async onSubmit(): Promise<void> {
    if (this.itemFormGroup.valid) {
      let highlightImageId = this.images().find((image) => image.isHighlight)?.id;
      highlightImageId = highlightImageId ?? this.images()[0]?.id;

      const newItem: NewCategoryItem = {
        id: Guid.create(),
        name: this.itemFormGroup.value.typeValue!,
        level: this.itemFormGroup.value.type!.level,
        parentId: this.itemFormGroup.value.parent?.id,
        notes: this.selectedCategoryItem()?.notes!,
        newCategoryId: this.selectedCategory()?.id!,
        audioFileIds: this.audioFiles().map((recording) => recording.id),
        imageIds: this.images().map((image) => image.id),
        highlightImageId: highlightImageId,
        pinIds: this.mapPins().map((pin) => pin.id),
        createDate: new Date(),
      };

      if (this.audioFiles().length > 0) await this.audioService.addAudioFiles(this.audioFiles());
      if (this.images().length > 0) await this.imageService.addImages(this.images());
      if (this.mapPins().length > 0) await this.mapService.addPins(this.mapPins());

      await this.itemsService.addItem(newItem);
      this.navController.back();
    } else {
      console.log(this.itemFormGroup.controls['parent']);
    }
  }
}
