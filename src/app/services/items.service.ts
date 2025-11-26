import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { NewCategoryItem } from '../models/new-category.interface';

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private items: NewCategoryItem[] = [];

  constructor() {}

  getItems(): Promise<NewCategoryItem[]> {
    return new Promise((resolve) => {
      resolve(this.items);
    });
  }

  getItemByGuid(guid: Guid): Promise<NewCategoryItem | undefined> {
    const item = this.items.find((item) => guid.toString() === item.id.toString());
    return new Promise((resolve) => {
      resolve(item);
    });
  }

  getItemsByGuid(guids: Guid[]): Promise<NewCategoryItem[]> {
    const items = this.items.filter((item) => guids.some((guid) => guid.toString() === item.id.toString()));
    return new Promise((resolve) => {
      resolve(items);
    });
  }

  setItems(items: NewCategoryItem[]) {
    this.items = items;
  }

  addItem(item: NewCategoryItem) {
    this.items.push(item);
  }

  addItems(items: NewCategoryItem[]) {
    this.items.push(...items);
  }

  removeItem(removeItem: NewCategoryItem) {
    this.items = this.items.filter((item) => item.id.toString() !== removeItem.id.toString());
  }
}
