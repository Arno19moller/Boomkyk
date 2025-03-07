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
import {
  ItemStructure as CategoryStructure,
  ItemStructureItem as CategoryStructureItem,
} from 'src/app/models/category-structure.interface';

@Component({
  standalone: true,
  selector: 'app-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss'],
  imports: [IonButton, IonItem, IonList, IonContent, IonModal, IonSelect, IonSelectOption, FormsModule],
})
export class BottomSheetComponent implements OnInit {
  fam1: CategoryStructureItem = { name: 'Fam 1' };
  fam2: CategoryStructureItem = { name: 'Fam 2' };
  gen1: CategoryStructureItem = { name: 'Genus 1', parent: this.fam1 };
  gen2: CategoryStructureItem = { name: 'Genus 2', parent: this.fam2 };
  spec1: CategoryStructureItem = { name: 'Species 1', parent: this.gen1 };
  spec2: CategoryStructureItem = { name: 'Species 2', parent: this.gen2 };

  family: CategoryStructure = {
    name: 'Family',
    level: 2,
    values: [this.fam1, this.fam2],
  };
  genus: CategoryStructure = {
    name: 'Genus',
    values: [this.gen1, this.gen2],
    level: 1,
    parent: this.family,
  };
  species: CategoryStructure = {
    name: 'Species',
    level: 0,
    values: [this.spec1, this.spec2],
    parent: this.genus,
  };

  isOpen = model<boolean>(false);
  structures = model<CategoryStructure[]>([this.family, this.genus, this.species]);
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

  dismissed(): void {
    this.clearClicked();
    this.isOpen.set(false);
  }
}
