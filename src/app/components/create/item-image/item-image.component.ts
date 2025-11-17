import { Component, input, model, OnInit } from '@angular/core';
import { IonButton, IonCard, IonIcon, IonImg, IonItem, IonList, IonTextarea } from '@ionic/angular/standalone';
import { LongPressDirective } from 'src/app/directives/long-press.directive';
import { CategoryStructureItem } from 'src/app/models/category-structure.interface';

@Component({
  standalone: true,
  selector: 'app-item-image',
  templateUrl: './item-image.component.html',
  styleUrls: ['./item-image.component.scss'],
  imports: [IonTextarea, IonImg, IonIcon, IonButton, IonItem, IonList, IonCard, LongPressDirective],
})
export class ItemImageComponent implements OnInit {
  selectedCategoryItem = input.required<CategoryStructureItem | undefined>();
  actionSheetType = model.required<'upload' | 'delete'>();
  isActionSheetOpen = model.required<boolean>();
  images = model.required<{ format: string; webPath: string; isHighlight: boolean }[]>();
  selectedImage = model.required<{ format: string; webPath: string; isHighlight: boolean } | undefined>();

  constructor() {}

  ngOnInit() {}

  startLongPress(image: { format: string; webPath: string; isHighlight: boolean }) {
    this.actionSheetType.set('delete');
    this.selectedImage.set(image);
    this.isActionSheetOpen.set(true);
  }

  doubleClick(image: { format: string; webPath: string; isHighlight: boolean }): void {
    this.images.update((images) => {
      images.map((image) => (image.isHighlight = false));
      return images;
    });
    image.isHighlight = true;
  }
}
