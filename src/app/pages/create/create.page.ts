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
import { ItemImageComponent } from 'src/app/components/create/item-image/item-image.component';
import { ItemMapComponent } from 'src/app/components/create/item-map/item-map.component';
import { SelectItemComponent } from 'src/app/components/create/select-item/select-item.component';
import { VoiceComponent } from 'src/app/components/create/voice/voice.component';
import { CategoryStructure, CategoryStructureItem } from 'src/app/models/category-structure.interface';
import { Level } from 'src/app/models/level.interface';
import { Pin } from 'src/app/models/pin.interface';
import { CategoryService } from 'src/app/services-new/category.service';
import { RecordingService } from 'src/app/services/recording.service';

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
  private categoryService = inject(CategoryService);
  protected recordingService = inject(RecordingService);

  isEdit: boolean = false;
  categories: CategoryStructure[] = [];

  selectedCategory = signal<CategoryStructure | undefined>(undefined);
  selectedCategoryItem = signal<CategoryStructureItem | undefined>(undefined);
  images = signal<{ format: string; webPath: string; isHighlight: boolean }[]>([]);
  mapPins = signal<Pin[]>([]);

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

  onSubmit(): void {
    if (this.itemFormGroup.valid) {
      console.log(this.categories);

      const type = this.categories.find((c) => c.level === this.itemFormGroup.value.type?.level);
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
    }
  }
}
