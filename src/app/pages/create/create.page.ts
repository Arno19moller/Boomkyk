import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  private route = inject(ActivatedRoute);

  isEdit = signal<boolean>(false);
  selectedCategory = signal<NewCategory | undefined>(undefined);
  selectedCategoryItem = signal<NewCategoryItem | undefined>(undefined);
  selectedParentItem = signal<NewCategoryItem | undefined>(undefined);
  selectedItemId: Guid | undefined;

  @ViewChild(SelectItemComponent) selectItemComponent!: SelectItemComponent;

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
    this.route.queryParamMap.subscribe(async (params) => {
      const id = params.get('id');

      if (id) {
        this.isEdit.set(true);
        this.selectedItemId = Guid.parse(id);

        const item = await this.itemsService.getItemByGuid(this.selectedItemId);
        this.selectedCategoryItem.set(item);

        if (item != undefined) {
          // Set basic item details
          this.itemFormGroup.controls['typeValue'].setValue(item.name);

          // Handle Category
          const categories = await this.categoryService.getCategories();
          const category = categories?.find((c) => c.id.toString() === item.newCategoryId?.toString());

          if (category) {
            this.itemFormGroup.controls['type'].setValue(category);
            this.selectedCategory.set(category);

            // Handle Parent
            if (item.parentId) {
              const parentItems = await this.categoryService.getCategoryItemsByLevel(category.level + 1);
              const parent = parentItems?.find((p) => p.id.toString() === item.parentId?.toString());
              if (parent) {
                this.selectedParentItem.set(parent);
              }
            }
          }

          // Load related data
          if (item.imageIds && item.imageIds.length > 0) {
            const images = await this.imageService.getImagesByGuids(item.imageIds);
            this.images.set(images);
          }

          if (item.audioFileIds && item.audioFileIds.length > 0) {
            const audioFiles = await this.audioService.getAudioFilesByGuid(item.audioFileIds);
            this.audioFiles.set(audioFiles);
          }

          if (item.pinIds && item.pinIds.length > 0) {
            const pins = await this.mapService.getPinsByGuid(item.pinIds);
            this.mapPins.set(pins);
          }
        }
      } else {
        // Default initialization for create mode
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
    });
  }

  async onSubmit(): Promise<void> {
    if (this.itemFormGroup.valid) {
      let highlightImageId = this.images().find((image) => image.isHighlight)?.id;
      highlightImageId = highlightImageId ?? this.images()[0]?.id;

      const newItem: NewCategoryItem = {
        id: Guid.create(),
        name: this.itemFormGroup.value.typeValue!,
        level: this.itemFormGroup.value.type?.level ?? this.selectedCategory()!.level,
        parentId: this.itemFormGroup.value.parent?.id,
        notes: this.selectedCategoryItem()?.notes!,
        newCategoryId: this.selectedCategory()?.id!,
        audioFileIds: this.audioFiles().map((recording) => recording.id),
        imageIds: this.images().map((image) => image.id),
        highlightImageId: highlightImageId,
        pinIds: this.mapPins().map((pin) => pin.id),
        createDate: new Date(),
      };

      if (this.isEdit() && this.selectedItemId) {
        this.addAndRemoveItems();
        newItem.id = this.selectedItemId;
        await this.itemsService.updateItem(newItem);
      } else {
        if (this.audioFiles().length > 0) await this.audioService.addAudioFiles(this.audioFiles());
        if (this.images().length > 0) await this.imageService.addImages(this.images());
        if (this.mapPins().length > 0) await this.mapService.addPins(this.mapPins());

        await this.itemsService.addItem(newItem);
      }
      this.navController.back();
    } else {
      console.log(this.itemFormGroup.controls['parent']);
    }
  }

  private async addAndRemoveItems() {
    const imagesToDelete =
      this.selectedCategoryItem()?.imageIds?.filter(
        (id) => !this.images().some((image) => image.id.toString() === id.toString()),
      ) ?? [];
    const audioFilesToDelete =
      this.selectedCategoryItem()?.audioFileIds?.filter(
        (id) => !this.audioFiles().some((audio) => audio.id.toString() === id.toString()),
      ) ?? [];
    const pinsToDelete =
      this.selectedCategoryItem()?.pinIds?.filter(
        (id) => !this.mapPins().some((pin) => pin.id.toString() === id.toString()),
      ) ?? [];

    if (imagesToDelete?.length > 0) {
      for (const imageId of imagesToDelete) {
        await this.imageService.removeImage(imageId);
      }
    }
    if (pinsToDelete?.length > 0) {
      for (const pinId of pinsToDelete) {
        await this.mapService.removePin(pinId);
      }
    }
    if (audioFilesToDelete?.length > 0) {
      for (const audioFileId of audioFilesToDelete) {
        await this.imageService.removeImage(audioFileId);
      }
    }

    const imagesToAdd =
      this.images()?.filter(
        (id) => !this.selectedCategoryItem()?.imageIds?.some((image) => image.toString() === id.toString()),
      ) ?? [];
    const audioFilesToAdd =
      this.audioFiles()?.filter(
        (id) => !this.selectedCategoryItem()?.audioFileIds?.some((audio) => audio.toString() === id.toString()),
      ) ?? [];
    const pinsToAdd =
      this.mapPins()?.filter(
        (id) => !this.selectedCategoryItem()?.pinIds?.some((pin) => pin.toString() === id.toString()),
      ) ?? [];

    if (imagesToAdd?.length > 0) {
      for (const image of imagesToAdd) {
        await this.imageService.addImage(image);
      }
    }
    if (audioFilesToAdd?.length > 0) {
      for (const audioFile of audioFilesToAdd) {
        await this.audioService.addAudioFile(audioFile);
      }
    }
    if (pinsToAdd?.length > 0) {
      for (const pin of pinsToAdd) {
        await this.mapService.addPin(pin);
      }
    }
  }
}
