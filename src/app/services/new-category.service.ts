import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Guid } from 'guid-typescript';
import { NewCategory, NewCategoryItem } from '../models/new-category.interface';

@Injectable({
  providedIn: 'root',
})
export class NewCategoryService {
  private _storage: Storage | null = null;
  private readonly CATEGORIES_INDEX_KEY = 'categories_index';
  private readonly CATEGORY_ITEMS_INDEX_KEY = 'category_items_index';
  private readonly CATEGORY_PREFIX = 'category_';
  private readonly CATEGORY_ITEM_PREFIX = 'category_item_';

  constructor(private storage: Storage) {
    this.initialiseStorage();
  }

  async initialiseStorage(): Promise<void> {
    if (this._storage == null) {
      const storage = await this.storage.create();
      this._storage = storage;
    }
    await this.seedDatabase();
  }

  private async seedDatabase(): Promise<void> {
    const categoriesIndex = await this._storage?.get(this.CATEGORIES_INDEX_KEY);

    if (!categoriesIndex || categoriesIndex.length === 0) {
      // Define Categories
      const family: NewCategory = { id: Guid.create(), name: 'Family', level: 2 };
      const genus: NewCategory = { id: Guid.create(), name: 'Genus', level: 1, parentId: family.id };
      const species: NewCategory = { id: Guid.create(), name: 'Species', level: 0, parentId: genus.id };

      // Define Category Items
      const fam1: NewCategoryItem = {
        id: Guid.create(),
        name: 'Fam 1',
        level: 2,
        newCategoryId: family.id,
        notes: '',
      };
      const fam2: NewCategoryItem = {
        id: Guid.create(),
        name: 'Fam 2',
        level: 2,
        newCategoryId: family.id,
        notes: '',
      };
      const gen1: NewCategoryItem = {
        id: Guid.create(),
        name: 'Genus 1',
        level: 1,
        newCategoryId: genus.id,
        parentId: fam1.id,
        notes: '',
      };
      const gen2: NewCategoryItem = {
        id: Guid.create(),
        name: 'Genus 2',
        level: 1,
        newCategoryId: genus.id,
        parentId: fam2.id,
        notes: '',
      };
      const spec1: NewCategoryItem = {
        id: Guid.create(),
        name: 'Species 1',
        level: 0,
        newCategoryId: species.id, // Corrected to point to Species Category
        parentId: gen1.id,
        notes: '',
      };
      const spec2: NewCategoryItem = {
        id: Guid.create(),
        name: 'Species 2',
        level: 0,
        newCategoryId: species.id, // Corrected to point to Species Category
        parentId: gen2.id,
        notes: '',
      };

      // Save Categories
      await this.saveCategory(family);
      await this.saveCategory(genus);
      await this.saveCategory(species);

      // Save Category Items
      await this.saveCategoryItem(fam1);
      await this.saveCategoryItem(fam2);
      await this.saveCategoryItem(gen1);
      await this.saveCategoryItem(gen2);
      await this.saveCategoryItem(spec1);
      await this.saveCategoryItem(spec2);
    }
  }

  public async getCategories(): Promise<NewCategory[]> {
    await this.initialiseStorage();
    const index = (await this._storage?.get(this.CATEGORIES_INDEX_KEY)) || [];
    const categories: NewCategory[] = [];

    for (const id of index) {
      const guidString = typeof id === 'string' ? id : (id as any).value || id.toString();
      const category = await this._storage?.get(`${this.CATEGORY_PREFIX}${guidString}`);
      if (category) {
        categories.push(this.deserializeCategory(category));
      }
    }

    categories.sort((a, b) => a.level - b.level);
    categories.sort((a, b) => a.name.localeCompare(b.name));
    return categories;
  }

  public async getCategoryItems(): Promise<NewCategoryItem[]> {
    await this.initialiseStorage();
    const index = (await this._storage?.get(this.CATEGORY_ITEMS_INDEX_KEY)) || [];
    const items: NewCategoryItem[] = [];

    for (const id of index) {
      const guidString = typeof id === 'string' ? id : (id as any).value || id.toString();
      const item = await this._storage?.get(`${this.CATEGORY_ITEM_PREFIX}${guidString}`);
      if (item) {
        items.push(this.deserializeCategoryItem(item));
      }
    }

    items.sort((a, b) => a.level - b.level);
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }

  public async getCategoryItemsByLevel(level: number): Promise<NewCategoryItem[]> {
    const items = await this.getCategoryItems();
    return items.filter((c) => c.level === level);
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
          const parentIdStr = currentItem.parentId.toString();
          currentItem = categoryItems.find((ci) => ci.id.toString() === parentIdStr);
        } else {
          currentItem = undefined;
        }
        if (currentItem != undefined) hierarchy.unshift(currentItem.name);
      }

      return hierarchy;
    }
    return [];
  }

  // Helper to save a category and update index
  private async saveCategory(category: NewCategory): Promise<void> {
    const guidString = category.id.toString();
    await this._storage?.set(`${this.CATEGORY_PREFIX}${guidString}`, category);

    // Update index
    const index = (await this._storage?.get(this.CATEGORIES_INDEX_KEY)) || [];
    if (!index.some((id: any) => id.toString() === guidString)) {
      index.push(category.id);
      await this._storage?.set(this.CATEGORIES_INDEX_KEY, index);
    }
  }

  // Helper to save a category item and update index
  async saveCategoryItem(item: NewCategoryItem): Promise<void> {
    const guidString = item.id.toString();
    await this._storage?.set(`${this.CATEGORY_ITEM_PREFIX}${guidString}`, item);

    // Update index
    const index = (await this._storage?.get(this.CATEGORY_ITEMS_INDEX_KEY)) || [];
    if (!index.some((id: any) => id.toString() === guidString)) {
      index.push(item.id);
      await this._storage?.set(this.CATEGORY_ITEMS_INDEX_KEY, index);
    }
  }

  private deserializeCategory(data: any): NewCategory {
    return {
      ...data,
      id: this.parseGuid(data.id),
      parentId: data.parentId ? this.parseGuid(data.parentId) : undefined,
    };
  }

  private deserializeCategoryItem(data: any): NewCategoryItem {
    return {
      ...data,
      id: this.parseGuid(data.id),
      parentId: data.parentId ? this.parseGuid(data.parentId) : undefined,
      newCategoryId: data.newCategoryId ? this.parseGuid(data.newCategoryId) : undefined,
      audioFileIds: data.audioFileIds?.map((id: any) => this.parseGuid(id)),
      imageIds: data.imageIds?.map((id: any) => this.parseGuid(id)),
      pinIds: data.pinIds?.map((id: any) => this.parseGuid(id)),
      highlightImageId: data.highlightImageId ? this.parseGuid(data.highlightImageId) : undefined,
    };
  }

  private parseGuid(guid: any): Guid {
    if (!guid) return Guid.createEmpty();
    if (guid instanceof Guid) return guid;
    if (typeof guid === 'object' && guid.value) return Guid.parse(guid.value);
    if (typeof guid === 'string') return Guid.parse(guid);
    return Guid.createEmpty();
  }
}
