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
  selectedParentItem = model.required<NewCategoryItem | undefined>();

  @Input({ required: true }) itemFormGroup!: FormGroup<{
    type: FormControl<NewCategory | null | undefined>;
    typeValue: FormControl<string | null>;
    parent: FormControl<NewCategory | null | undefined>;
  }>;
  @Output() parentValidatorChange = new EventEmitter<boolean>();

  constructor() {
    effect(async () => {
      if (this.selectedCategory() != undefined) {
        if (this.categories().length === 0) {
          const categories = await this.newCategoryService.getCategories();
          if (categories == undefined) return;
          this.categories.set(categories);
        }

        this.selectedLevelChange(this.selectedCategory());
      }
    });

    effect(() => {
      if (this.selectedParentItem()) {
        this.itemFormGroup.controls['parent'].setValue(this.selectedParentItem());
      }
    });

    effect(() => {
      if (this.isEdit()) {
        this.itemFormGroup.controls['type'].disable();
      } else {
        this.itemFormGroup.controls['type'].enable();
      }
    });
  }

  async ngOnInit() {}

  async selectedLevelChange(category: NewCategory | undefined = undefined): Promise<void> {
    let parentItems: NewCategoryItem[] = [];
    const cat = category ?? this.itemFormGroup.controls['type'].value;

    await this.getParentCategoryItems(parentItems, cat!);
    this.resetParentControls(this.parentItems());

    this.parentCategory.set(this.categories().find((c) => c.id.toString() === cat?.parentId?.toString()));
    this.selectedCategory.set(this.categories().find((c) => c.id.toString() === cat?.id.toString()));
    this.itemFormGroup.controls['type'].setValue(this.selectedCategory());

    if (this.selectedParentItem() != undefined) {
      this.itemFormGroup.controls['parent'].setValue(this.selectedParentItem());
    }
  }

  private async getParentCategoryItems(parentItems: NewCategoryItem[], cat: NewCategory) {
    const level = cat?.level ?? 0;
    const categories = await this.newCategoryService.getCategoryItemsByLevel(level + 1);

    if (categories == undefined) return;
    parentItems = categories;
    this.parentItems.set(parentItems);
  }

  private resetParentControls(parentItems: NewCategoryItem[]): void {
    if (parentItems.length === 0) {
      this.itemFormGroup.controls['parent'].removeValidators([Validators.required]);
    } else {
      this.itemFormGroup.controls['parent'].addValidators([Validators.required]);
      this.itemFormGroup.controls['parent'].setValue(undefined);
    }
    this.itemFormGroup.controls['parent'].updateValueAndValidity();
    this.itemFormGroup.controls['parent'].setErrors(null);
  }

  compareWith(o1: any, o2: any) {
    return o1 && o2 ? o1.id.toString() === o2.id.toString() : o1 === o2;
  }
}
