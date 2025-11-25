import { Component, effect, EventEmitter, inject, Input, input, model, OnInit, Output, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonCard, IonInput, IonItem, IonList, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { NewCategory, NewCategoryItem } from 'src/app/models/new-category.interface';
import { NewCategoryService } from 'src/app/services/new-category.service';

@Component({
  standalone: true,
  selector: 'app-select-item',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss'],
  imports: [IonInput, IonItem, IonList, IonCard, IonSelect, IonSelectOption, FormsModule, ReactiveFormsModule],
})
export class SelectItemComponent implements OnInit {
  private newCategoryService = inject(NewCategoryService);

  categories = signal<NewCategory[]>([]);
  isEdit = input.required<boolean>();
  parentItems = signal<NewCategoryItem[]>([]);
  parentCategory = signal<NewCategory | undefined>(undefined);
  selectedCategory = model.required<NewCategory | undefined>();
  selectedCategoryItem = model.required<NewCategoryItem | undefined>();

  @Input() itemFormGroup = new FormGroup({
    type: new FormControl<NewCategory | undefined>(undefined, [Validators.required]),
    typeValue: new FormControl('', [Validators.required]),
    parent: new FormControl<NewCategory | undefined>(undefined, [Validators.required]),
  });
  @Output() parentValidatorChange = new EventEmitter<boolean>();

  constructor() {
    effect(() => {
      if (this.selectedCategory() != undefined && this.itemFormGroup.controls['type'].value == undefined) {
        this.itemFormGroup.controls['type']!.setValue(this.selectedCategory());
        this.selectedLevelChange(this.selectedCategory());
      }
    });
  }

  ngOnInit() {
    this.newCategoryService.getCategories().then((categories) => {
      if (categories == undefined) return;
      this.categories.set(categories);
    });
  }

  async selectedLevelChange(category: NewCategory | undefined = undefined): Promise<void> {
    let parentItems: NewCategoryItem[] = [];
    const cat = category ?? this.itemFormGroup.controls['type'].value;

    await this.getParentCategoryItems(parentItems, cat!);
    this.resetParentControls(this.parentItems());

    this.parentCategory.set(this.categories().find((c) => c.id.toString() === cat?.parentId?.toString()));
    this.selectedCategory.set(this.categories().find((c) => c.id.toString() === cat?.id.toString()));
  }

  private async getParentCategoryItems(parentItems: NewCategoryItem[], cat: NewCategory) {
    const level = cat?.level ?? 0;
    const categories = await this.newCategoryService.getCategoryItemsByLevel(level + 1);

    if (categories == undefined) return;
    parentItems = categories;
    this.parentItems.set(parentItems);
  }

  private resetParentControls(parentItems: NewCategoryItem[]): void {
    this.itemFormGroup.controls['parent'].setValue(undefined);

    this.parentValidatorChange.emit(parentItems.length !== 0);

    if (parentItems.length === 0) {
      this.itemFormGroup.controls['parent'].removeValidators([Validators.required]);
    } else {
      this.itemFormGroup.controls['parent'].addValidators([Validators.required]);
    }
  }
}
