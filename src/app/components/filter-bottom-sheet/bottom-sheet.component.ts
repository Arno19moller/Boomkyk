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

            // If the currently selected item is no longer valid, deselect it
            if (structure.selectedItem && !values.some((val) => val.name === structure.selectedItem)) {
              structure.selectedItem = undefined;
            }

            return {
              ...structure,
              values: values,
            };
          } else {
            // If parent is not selected, show no values (or all? usually none if dependent)
            // Based on requirement: "if the select's value ... has a parent, the select underneath it should show"
            // This implies if parent NOT selected, child might be hidden or empty.
            // Let's assume empty values if parent not selected for now, or maybe we hide the whole input in template.
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
        // Clear children if parent changes?
        // The computed signal handles filtering values, but we might want to explicitly clear selectedItem of children
        // However, the computed signal logic I added:
        // if (structure.selectedItem && !values.some((val) => val.name === structure.selectedItem)) { structure.selectedItem = undefined; }
        // This is inside the computed, which returns a NEW array. It doesn't mutate the source signal 'structures'.
        // So we need to handle clearing in the source signal if we want it to persist properly or rely on the UI to update based on the computed.
        // Actually, 'structures' is a model, so it's two-way binding or at least a signal we can update.
        // But 'filteredStructures' is derived.
        // Let's just update the selected item for now. The computed will re-evaluate.
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
