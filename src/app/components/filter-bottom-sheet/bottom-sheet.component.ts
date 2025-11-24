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
import { CategoryFilter } from 'src/app/models/legacy/category-filter.interface';
import { CategoryStructure } from 'src/app/models/legacy/category-structure.interface';

@Component({
  standalone: true,
  selector: 'app-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss'],
  imports: [IonButton, IonItem, IonList, IonContent, IonModal, IonSelect, IonSelectOption, FormsModule],
})
export class BottomSheetComponent implements OnInit {
  isOpen = model<boolean>(false);
  structures = model<CategoryStructure[]>([]);
  filteredStructures: Signal<CategoryStructure[]> = computed(() => {
    const structures = this.structures();
    if (structures?.length > 0) {
      return structures.map((structure) => {
        if (structure.parent?.selectedItem != undefined) {
          const values = structure.values.filter((x) => {
            return x.parent?.name === structure.parent?.selectedItem;
          });
          if (!values.some((val) => val.name === structure.selectedItem)) {
            structure.selectedItem = undefined;
          }
          return {
            ...structure,
            values: values,
          };
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
        if (x.name === structure.name) {
          x.selectedItem = structure.values.find((x) => x.name === selectedItem)?.name;
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
    this.clearClicked();
    this.isOpen.set(false);
  }
}
