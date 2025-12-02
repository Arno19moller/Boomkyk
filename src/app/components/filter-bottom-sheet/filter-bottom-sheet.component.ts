import { Component, computed, model, OnInit, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonItem,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { CategoryFilter } from 'src/app/models/category-filter.interface';
import { CategoryStructure } from 'src/app/models/category-structure.interface';

@Component({
  standalone: true,
  selector: 'app-filter-bottom-sheet',
  templateUrl: './filter-bottom-sheet.component.html',
  styleUrls: ['./filter-bottom-sheet.component.scss'],
  imports: [IonButton, IonItem, IonList, IonContent, IonModal, IonSelect, IonSelectOption, FormsModule],
})
export class FilterBottomSheetComponent implements OnInit {
  isOpen = model<boolean>(false);
  structures = model<CategoryStructure[]>([]);

  filteredStructures: Signal<CategoryStructure[]> = computed(() => {
    const structures = this.structures();
    if (structures?.length > 0) {
      return structures.map((structure) => {
        if (structure.parentId) {
          const parentStructure = structures.find((s) => s.id.toString() === structure.parentId?.toString());
          if (parentStructure && parentStructure.selectedItem) {
            const values = structure.values.filter((x) => {
              return (
                x.parentId &&
                parentStructure.values.find((p) => p.name === parentStructure.selectedItem)?.id.toString() ===
                  x.parentId.toString()
              );
            });

            if (structure.selectedItem && !values.some((val) => val.name === structure.selectedItem)) {
              structure.selectedItem = undefined;
            }

            return {
              ...structure,
              values: values,
            };
          } else {
            return { ...structure, values: [] };
          }
        } else {
          return { ...structure };
        }
      });
    }
    return structures;
  });
  filters = model<CategoryFilter[]>([]);

  constructor() {}

  ngOnInit() {}

  valueSelected(structure: CategoryStructure, selectedItem: string): void {
    this.structures.update((structures) => [
      ...structures.map((x) => {
        if (x.id.toString() === structure.id.toString()) {
          x.selectedItem = selectedItem;
        }
        return x;
      }),
    ]);
  }

  clearClicked(): void {
    this.structures.update((structures) => [
      ...structures.map((x) => {
        x.selectedItem = undefined;
        return x;
      }),
    ]);
    this.filters.set([]);
  }

  filterClicked(): void {
    const i = this.structures()
      .filter((structure) => structure.selectedItem != undefined)
      .map((structure) => {
        return {
          level: structure.level,
          value: structure.selectedItem!,
        };
      });
    this.filters.set(i);
    this.isOpen.set(false);
  }

  dismissed(): void {
    this.isOpen.set(false);
  }
}
