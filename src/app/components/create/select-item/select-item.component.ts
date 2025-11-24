import { Component, effect, inject, Input, input, model, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonCard, IonInput, IonItem, IonList, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { CategoryStructure, CategoryStructureItem } from 'src/app/models/category-structure.interface';
import { Level } from 'src/app/models/level.interface';
import { CategoryService } from 'src/app/services-new/category.service';

@Component({
  standalone: true,
  selector: 'app-select-item',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss'],
  imports: [IonInput, IonItem, IonList, IonCard, IonSelect, IonSelectOption, FormsModule, ReactiveFormsModule],
})
export class SelectItemComponent implements OnInit {
  private categoryService = inject(CategoryService);

  categories: CategoryStructure[] = [];
  isEdit = input.required<boolean>();
  selectedCategory = model.required<CategoryStructure | undefined>();
  selectedCategoryItem = model.required<CategoryStructureItem | undefined>();

  @Input() itemFormGroup = new FormGroup({
    type: new FormControl<Level | undefined>(undefined, [Validators.required]),
    typeValue: new FormControl('', [Validators.required]),
    newTypeValue: new FormControl(''),
    parent: new FormControl<Level | undefined>(undefined, [Validators.required]),
  });

  levels = signal<Level[]>([]);
  parentLevels = signal<Level[]>([]);

  constructor() {
    effect(() => {
      if (this.itemFormGroup.controls['type'].value == undefined) {
        this.itemFormGroup.controls['type']!.setValue(this.levels()[0]);
      }
    });
  }

  ngOnInit() {
    this.categoryService.getCategories().then((categories) => {
      if (categories == undefined) return;

      categories = categories.sort((a, b) => a.level - b.level);
      this.categories = categories;

      const levels = categories.map((cat) => {
        const lvl = {
          name: cat.name,
          level: cat.level,
        };
        if (cat.parent != undefined) {
          return {
            ...lvl,
            parent: {
              name: cat.parent!.name,
              level: cat.parent!.level,
            },
          };
        } else {
          return lvl;
        }
      });
      this.levels.set(levels.length > 0 ? levels : []);
      this.selectedLevelChange(this.levels()[0]);
    });
  }

  selectedLevelChange(level: Level | undefined = undefined): void {
    const lvl = level ?? this.itemFormGroup.controls['type'].value;
    const parentLvls = this.categories
      .filter((c) => c.level === lvl?.parent?.level)
      .flatMap((c: any) => {
        return c.values.map((val: CategoryStructureItem) => {
          return {
            level: c.level,
            name: val.name,
          };
        });
      });

    this.parentLevels.set(parentLvls);
    this.itemFormGroup.controls['parent'].setValue(undefined);
    if (parentLvls.length === 0) {
      this.itemFormGroup.controls['parent'].clearValidators();
    } else {
      this.itemFormGroup.controls['parent'].addValidators([Validators.required]);
    }

    this.selectedCategoryItem.set(this.categories.find((c) => c.name === lvl?.name && c.level === lvl.level));
  }
}
