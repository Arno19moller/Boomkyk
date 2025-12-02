import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Guid } from 'guid-typescript';
import { ItemIndex } from '../models/item-index.interface';
import { NewCategoryItem } from '../models/new-category.interface';

import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private storage = inject(Storage);
  private loadingService = inject(LoadingService);

  private _storage: Storage | null = null;
  private readonly ITEMS_INDEX_KEY = 'items_index';
  private readonly ITEM_PREFIX = 'item_';

  constructor() {
    this.initialiseStorage();
  }

  async initialiseStorage(): Promise<void> {
    if (this._storage == null) {
      const storage = await this.storage.create();
      this._storage = storage;
    }
  }

  /**
   * Get all items (loads full item data)
   */
  async getItems(): Promise<NewCategoryItem[]> {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Loading items...';
    }
    try {
      await this.initialiseStorage();

      const index = await this.getItemsIndex();
      const items: NewCategoryItem[] = [];

      for (const indexEntry of index) {
        const item = await this.getItemByGuid(indexEntry.id);

        if (item) {
          items.push(item);
        }
      }

      return items;
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  /**
   * Get lightweight index for listing (optimized for home page)
   */
  async getItemsIndex(): Promise<ItemIndex[]> {
    await this.initialiseStorage();

    try {
      const index = await this._storage?.get(this.ITEMS_INDEX_KEY);
      return index || [];
    } catch (error) {
      console.error('Error loading items index:', error);
      return [];
    }
  }

  /**
   * Get single item by GUID (fast direct lookup)
   */
  async getItemByGuid(guid: Guid): Promise<NewCategoryItem | undefined> {
    await this.initialiseStorage();

    try {
      const guidString = typeof guid === 'string' ? guid : (guid as any).value || guid.toString();
      const item = await this._storage?.get(`${this.ITEM_PREFIX}${guidString}`);

      if (item) {
        // Deserialize Guid properties back to Guid instances
        return this.deserializeItem(item);
      }

      return undefined;
    } catch (error) {
      console.error('Error loading item:', error);
      return undefined;
    }
  }

  /**
   * Get multiple items by GUIDs
   */
  async getItemsByGuid(guids: Guid[]): Promise<NewCategoryItem[]> {
    await this.initialiseStorage();

    const items: NewCategoryItem[] = [];

    for (const guid of guids) {
      const item = await this.getItemByGuid(guid);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Add a new item (stores item + updates index)
   */
  async addItem(item: NewCategoryItem): Promise<void> {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Adding item...';
    }
    try {
      await this.initialiseStorage();
      const id = item.id as any;

      // Store the full item
      await this._storage?.set(`${this.ITEM_PREFIX}${id.value.toString()}`, item);

      // Update the index
      const index = await this.getItemsIndex();
      const indexEntry: ItemIndex = {
        id: item.id,
        name: item.name,
        createDate: item.createDate,
        highlightImageId: item.highlightImageId,
        level: item.level,
        parentId: item.parentId,
        newCategoryId: item.newCategoryId,
      };

      index.push(indexEntry);
      await this._storage?.set(this.ITEMS_INDEX_KEY, index);
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  /**
   * Add multiple items
   */
  async addItems(items: NewCategoryItem[]): Promise<void> {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Adding items...';
    }
    try {
      for (const item of items) {
        await this.addItem(item);
      }
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  /**
   * Remove an item (removes item + updates index)
   */
  async removeItem(removeItem: NewCategoryItem): Promise<void> {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Removing item...';
    }
    try {
      await this.initialiseStorage();

      const guidString =
        typeof removeItem.id === 'string' ? removeItem.id : (removeItem.id as any).value || removeItem.id.toString();
      await this._storage?.remove(`${this.ITEM_PREFIX}${guidString}`);

      // Update the index
      const index = await this.getItemsIndex();
      const updatedIndex = index.filter((indexEntry) => this.parseGuid(indexEntry.id).toString() !== guidString);
      await this._storage?.set(this.ITEMS_INDEX_KEY, updatedIndex);
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  /**
   * Update an existing item
   */
  async updateItem(item: NewCategoryItem): Promise<void> {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Updating item...';
    }
    try {
      await this.initialiseStorage();

      // Update the full item
      await this._storage?.set(`${this.ITEM_PREFIX}${item.id.toString()}`, item);

      // Update the index entry
      const index = await this.getItemsIndex();
      const indexEntryIndex = index.findIndex((entry) => entry.id.toString() === item.id.toString());

      if (indexEntryIndex > -1) {
        index[indexEntryIndex] = {
          id: item.id,
          name: item.name,
          createDate: item.createDate,
          highlightImageId: item.highlightImageId,
          level: item.level,
          parentId: item.parentId,
          newCategoryId: item.newCategoryId,
        };
        await this._storage?.set(this.ITEMS_INDEX_KEY, index);
      }
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  /**
   * Clear all items (for testing/reset)
   */
  async clearAll(): Promise<void> {
    const shouldHandleLoading = !this.loadingService.isLoading;
    if (shouldHandleLoading) {
      this.loadingService.isLoading = true;
      this.loadingService.loadingMessage = 'Clearing items...';
    }
    try {
      await this.initialiseStorage();

      const index = await this.getItemsIndex();

      // Remove all individual items
      for (const indexEntry of index) {
        await this._storage?.remove(`${this.ITEM_PREFIX}${indexEntry.id.toString()}`);
      }

      // Clear the index
      await this._storage?.set(this.ITEMS_INDEX_KEY, []);
    } finally {
      if (shouldHandleLoading) {
        this.loadingService.isLoading = false;
      }
    }
  }

  /**
   * Helper method to deserialize Guid properties from storage
   * When items are stored in JSON, Guid objects become plain objects with a 'value' property
   * This method converts them back to proper Guid instances
   */
  private deserializeItem(item: any): NewCategoryItem {
    return {
      ...item,
      id: this.parseGuid(item.id),
      parentId: item.parentId ? this.parseGuid(item.parentId) : undefined,
      newCategoryId: item.newCategoryId ? this.parseGuid(item.newCategoryId) : undefined,
      highlightImageId: item.highlightImageId ? this.parseGuid(item.highlightImageId) : undefined,
      audioFileIds: item.audioFileIds?.map((id: any) => this.parseGuid(id)),
      imageIds: item.imageIds?.map((id: any) => this.parseGuid(id)),
      pinIds: item.pinIds?.map((id: any) => this.parseGuid(id)),
    };
  }

  /**
   * Helper method to parse a Guid from various formats
   */
  private parseGuid(guid: any): Guid {
    if (!guid) return Guid.createEmpty();

    if (guid instanceof Guid) return guid;

    if (typeof guid === 'object' && guid.value) {
      return Guid.parse(guid.value);
    }

    if (typeof guid === 'string') {
      return Guid.parse(guid);
    }

    return Guid.createEmpty();
  }
}
