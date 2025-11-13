import { Component, input, model, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonCard, IonInput, IonItem, IonList, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { CategoryStructure, CategoryStructureItem } from 'src/app/models/category-structure.interface';

@Component({
  standalone: true,
  selector: 'app-select-item',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss'],
  imports: [IonInput, IonItem, IonList, IonCard, IonSelect, IonSelectOption, FormsModule],
})
export class SelectItemComponent implements OnInit {
  categories = input.required<CategoryStructure[]>();
  isEdit = input.required<boolean>();
  selectedCategory = model.required<CategoryStructure | undefined>();
  selectedCategoryItem = model.required<CategoryStructureItem | undefined>();

  constructor() {}

  ngOnInit() {
    this.updateName({ detail: { value: 'asd' } }); //TODO: remove
  }

  updateName(event: any): void {
    const newName = event.detail.value;
    this.selectedCategoryItem.update((current) => ({ ...current, name: newName }));
  }
}
