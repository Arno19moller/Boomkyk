import { Injectable } from '@angular/core';
import { CategoryStructure, CategoryStructureItem } from 'src/app/models/category-structure.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private fam1: CategoryStructureItem = { name: 'Fam 1' };
  private fam2: CategoryStructureItem = { name: 'Fam 2' };
  private gen1: CategoryStructureItem = {
    name: 'Genus 1',
    parent: this.fam1,
  };
  private gen2: CategoryStructureItem = {
    name: 'Genus 2',
    parent: this.fam2,
  };
  private spec1: CategoryStructureItem = {
    name: 'Species 1',
    parent: this.gen1,
  };
  private spec2: CategoryStructureItem = {
    name: 'Species 2',
    parent: this.gen2,
  };

  private family: CategoryStructure = {
    name: 'Family',
    level: 2,
    values: [this.fam1, this.fam2],
    allowImages: false,
    allowNotes: false,
    allowLocations: false,
  };
  private genus: CategoryStructure = {
    name: 'Genus',
    values: [this.gen1, this.gen2],
    level: 1,
    parent: this.family,
    allowImages: false,
    allowNotes: false,
    allowLocations: false,
  };
  private species: CategoryStructure = {
    name: 'Species',
    level: 0,
    values: [this.spec1, this.spec2],
    parent: this.genus,
    allowImages: true,
    allowNotes: true,
    allowLocations: true,
  };

  constructor() {}

  public getCategories(): Promise<CategoryStructure[] | undefined> {
    return new Promise((resolve, _) => {
      resolve([this.family, this.genus, this.species]);
    });
  }
}
