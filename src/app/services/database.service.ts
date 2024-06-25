import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Guid } from 'guid-typescript';
import { BoomkykPhoto } from '../models/photo.interface';
import { TreeType } from '../models/tree-type.enum';
import { Tree } from '../models/tree.interface';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public isWebPlatform: boolean = false;
  public isLoading: boolean = false;
  public loadingMessage: string = '';
  public toastMessage: string = '';
  public openToast: boolean = false;

  private _storage: Storage | null = null;
  private TREE_STORAGE: string = 'trees';
  private selectedTree: Tree | undefined = undefined; // used when navigating back
  private platform: Platform;

  constructor(
    platform: Platform,
    private storage: Storage,
  ) {
    this.platform = platform;
    this.isWebPlatform = !this.platform.is('hybrid');
    this.initialiseStorage();
  }

  async initialiseStorage(): Promise<void> {
    if (this._storage == null) {
      const storage = await this.storage.create();
      this._storage = storage;
    }
  }

  async getTreesByType(type: TreeType): Promise<Tree[]> {
    let trees = await this.getTrees();

    trees = trees.filter((x) => x.type === type);

    // Only for web
    if (this.isWebPlatform) {
      for (let tree of trees) {
        await this.updateImagePaths(tree);
      }
    }

    return trees;
  }

  async getSelectedTree(id?: string): Promise<Tree | undefined> {
    const trees = await this.getTrees();

    const tree = trees.find((x) => x.id['value'] === (id ?? this.selectedTree?.id['value']));

    if (this.isWebPlatform && tree) {
      await this.updateImagePaths(tree);
    }

    return tree;
  }

  async getTreeByName(name: string): Promise<Tree | undefined> {
    const trees = await this.getTrees();
    // Add Nursery if not already added
    if (!trees.some((x) => x.title === 'Nursery')) {
      const nursery: Tree = {
        id: Guid.create(),
        title: 'Nursery',
        type: TreeType.Genus,
      };
      await this.addTree(nursery);
      return nursery;
    }

    const tree = trees.find((x) => x.title === name);

    if (this.isWebPlatform && tree) {
      await this.updateImagePaths(tree);
    }

    return tree;
  }

  async getTreesList(type: TreeType, id?: string): Promise<Tree[]> {
    let trees = await this.getTrees();

    // Get all trees linked to Nursery & trees not linked to a parent
    if (await this.isNursery(id ?? '')) {
      trees = trees.filter(
        (x) =>
          (x.type == type &&
            x.groupId !== undefined &&
            x.groupId['value'] === (id ?? this.selectedTree?.id['value'])) ||
          (x.type !== TreeType.Family && x.groupId == undefined && x.id['value'] !== id),
      );
    }
    // Get all trees that match the specified type and groupId
    else {
      trees = trees.filter(
        (x) =>
          x.type == type && x.groupId !== undefined && x.groupId['value'] === (id ?? this.selectedTree?.id['value']),
      );
    }

    if (this.isWebPlatform) {
      for (let tree of trees) {
        await this.updateImagePaths(tree);
      }
    }

    return trees;
  }

  async setSelectedTreeGroup(id: string): Promise<void> {
    this.selectedTree = await this.getSelectedTree(id);
  }

  async addTree(tree: Tree): Promise<void> {
    this.startLoading('Saving Tree');
    const trees = await this.getTrees();
    trees.push(tree);
    await this.saveTrees(trees);
    this.stopLoading();
  }

  async updateTree(tree: Tree): Promise<void> {
    this.startLoading('Updating Tree');
    const trees = await this.getTrees();
    let index = trees.findIndex((x) => x.id['value'] === tree.id['value']);
    trees[index] = tree;

    await this.saveTrees(trees);
    this.stopLoading();
  }

  public startLoading(loadingText: string): void {
    this.isLoading = true;
    this.loadingMessage = loadingText;
  }

  public stopLoading(): void {
    setTimeout(() => {
      this.isLoading = false;
    }, 100);
  }

  // private
  private async saveTrees(trees: Tree[]): Promise<void> {
    if (this._storage == null) {
      await this.initialiseStorage();
    }

    await this._storage?.set(this.TREE_STORAGE, JSON.stringify(trees));
  }

  public async getTrees(): Promise<Tree[]> {
    if (this._storage == null) {
      await this.initialiseStorage();
    }

    try {
      const value = (await this._storage?.get(this.TREE_STORAGE)) ?? [];
      const trees = (value ? JSON.parse(value) : []) as Tree[];
      trees.sort((a, b) => {
        return a.title.localeCompare(b.title);
      });
      return trees;
    } catch (error) {
      await this._storage?.set(this.TREE_STORAGE, '[]');
      return [] as Tree[];
    }
  }

  private async updateImagePaths(tree: Tree): Promise<void> {
    for (let photo of tree.images ?? []) {
      const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data,
      });

      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }

  public async deleteTree(deleteTreeId: string): Promise<void> {
    this.startLoading('Deleting Tree');
    const trees = await this.getTrees();
    let index = trees.findIndex((x) => x.id['value'] === deleteTreeId);

    if (trees[index].type === TreeType.Family) {
      let childTrees = trees.filter((x) => x.groupId != undefined && x.groupId['value'] === trees[index].id['value']);

      // remove child trees from storage list
      this.deleteChildTrees(trees, childTrees);
    }

    trees.splice(index, 1);
    await this.saveTrees(trees);
    this.stopLoading();

    this.toastMessage = 'Tree successfully deleted';
    this.openToast = true;
  }

  deleteChildTrees(trees: Tree[], childTrees: Tree[]): void {
    childTrees.map(async (tree) => {
      const subSubTrees = trees.filter((x) => x.groupId != undefined && x.groupId['value'] === tree.id['value']);
      if (subSubTrees?.length > 0) {
        this.deleteChildTrees(trees, subSubTrees);
      }

      let childIndex = trees.findIndex((x) => x.id['value'] === tree.id['value']);
      trees.splice(childIndex, 1);

      // Delete all tree images
      await this.deletePicture(tree.images ?? []);
    });
  }

  private async deletePicture(photos: BoomkykPhoto[]) {
    for (let i = 0; i < photos.length; i++) {
      // delete photo file from filesystem
      const filename = photos[i].filepath.substring(photos[i].filepath.lastIndexOf('/') + 1);

      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Data,
      });
    }
  }

  private async isNursery(id: string): Promise<boolean> {
    const trees = await this.getTrees();
    const tree = trees.find((t) => t.id['value'] === id);
    return tree?.title === 'Nursery';
  }
}
