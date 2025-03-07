import { Component, model, OnInit } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonItem,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { ItemStructure, ItemStructureItem } from 'src/app/models/item-structure.interface';

@Component({
  standalone: true,
  selector: 'app-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss'],
  imports: [IonButton, IonItem, IonList, IonContent, IonModal, IonSelect, IonSelectOption],
})
export class BottomSheetComponent implements OnInit {
  fam1: ItemStructureItem = { name: 'Fam 1' };
  fam2: ItemStructureItem = { name: 'Fam 2' };
  gen1: ItemStructureItem = { name: 'Genus 1', parent: this.fam1 };
  gen2: ItemStructureItem = { name: 'Genus 2', parent: this.fam2 };
  spec1: ItemStructureItem = { name: 'Species 1', parent: this.gen1 };
  spec2: ItemStructureItem = { name: 'Species 2', parent: this.gen2 };

  family: ItemStructure = {
    name: 'Family',
    level: 2,
    values: [this.fam1, this.fam2],
  };
  genus: ItemStructure = {
    name: 'Genus',
    values: [this.gen1, this.gen2],
    level: 1,
    parent: this.family,
  };
  species: ItemStructure = {
    name: 'Species',
    level: 0,
    values: [this.spec1, this.spec2],
    parent: this.genus,
  };

  isOpen = model<boolean>(false);
  structure = model<ItemStructure[]>([this.family, this.genus, this.species]);
  filteredStructure: ItemStructure[] = [];
  constructor() {}

  ngOnInit() {
    this.filteredStructure = this.structure();
  }

  valueSelected(structure: ItemStructure, selectedValue: string): void {
    if (structure.level > 0) {
      this.filteredStructure = this.structure().map((items) => {
        if (items.level == structure.level - 1) {
          return {
            name: items.name,
            level: items.level,
            parent: items.parent,
            values: items.values.filter((val) => val.parent?.name === selectedValue),
          };
        } else {
          return items;
        }
      });

      console.log(this.filteredStructure);
    }
  }

  dismissed() {
    this.isOpen.set(false);
  }
}
