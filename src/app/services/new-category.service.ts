import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { NewCategory, NewCategoryItem } from '../models/new-category.interface';

@Injectable({
  providedIn: 'root',
})
export class NewCategoryService {
  private family: NewCategory = { id: Guid.create(), name: 'Family', level: 2 };
  private genus: NewCategory = { id: Guid.create(), name: 'Genus', level: 1, parentId: this.family.id };
  private species: NewCategory = { id: Guid.create(), name: 'Species', level: 0, parentId: this.genus.id };

  private fam1: NewCategoryItem = {
    id: Guid.create(),
    name: 'Fam 1',
    level: 2,
    newCategoryId: this.family.id,
    notes: '',
  };
  private fam2: NewCategoryItem = {
    id: Guid.create(),
    name: 'Fam 2',
    level: 2,
    newCategoryId: this.family.id,
    notes: '',
  };
  private gen1: NewCategoryItem = {
    id: Guid.create(),
    name: 'Genus 1',
    level: 1,
    newCategoryId: this.genus.id,
    parentId: this.fam1.id,
    notes: '',
  };
  private gen2: NewCategoryItem = {
    id: Guid.create(),
    name: 'Genus 2',
    level: 1,
    newCategoryId: this.genus.id,
    parentId: this.fam2.id,
    notes: '',
  };
  private spec1: NewCategoryItem = {
    id: Guid.create(),
    name: 'Species 1',
    level: 0,
    newCategoryId: this.gen1.id,
    parentId: this.gen1.id,
    notes: '',
  };
  private spec2: NewCategoryItem = {
    id: Guid.create(),
    name: 'Species 2',
    level: 0,
    newCategoryId: this.gen2.id,
    parentId: this.gen2.id,
    notes: '',
  };

  constructor() {}

  public getCategories(): Promise<NewCategory[]> {
    const categories: NewCategory[] = [this.family, this.genus, this.species];
    categories.sort((a, b) => a.level - b.level);
    categories.sort((a, b) => a.name.localeCompare(b.name));
    return new Promise((resolve, _) => {
      resolve(categories);
    });
  }

  public getCategoryItems(): Promise<NewCategoryItem[]> {
    const categories: NewCategoryItem[] = [this.fam1, this.fam2, this.gen1, this.gen2, this.spec1, this.spec2];
    categories.sort((a, b) => a.level - b.level);
    categories.sort((a, b) => a.name.localeCompare(b.name));
    return new Promise((resolve, _) => {
      resolve(categories);
    });
  }

  public getCategoryItemsByLevel(level: number): Promise<NewCategoryItem[]> {
    const categories: NewCategoryItem[] = [this.fam1, this.fam2, this.gen1, this.gen2, this.spec1, this.spec2];
    categories.sort((a, b) => a.level - b.level);
    categories.sort((a, b) => a.name.localeCompare(b.name));
    return new Promise((resolve, _) => {
      resolve(categories.filter((c) => c.level === level));
    });
  }

  public async getHierarchy(item: NewCategoryItem | undefined): Promise<string[]> {
    if (item && item.newCategoryId) {
      const categoryItems = await this.getCategoryItems();
      const hierarchy: string[] = [];

      // Start with the current item
      let currentItem: NewCategoryItem | undefined = item;

      // Build hierarchy by traversing parent category items
      while (currentItem) {
        if (currentItem.parentId) {
          currentItem = categoryItems.find((ci) => ci.id.toString() === currentItem!.parentId!.toString());
        } else {
          currentItem = undefined;
        }
        if (currentItem != undefined) hierarchy.unshift(currentItem.name);
      }

      return hierarchy;
    }
    return [];
  }
}
