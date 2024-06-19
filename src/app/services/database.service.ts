import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { AlertController, Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
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

  private _storage: Storage | null = null;
  private TREE_STORAGE: string = 'trees';
  private selectedTreeGroup: Tree | undefined = undefined; // used when navigating back
  private deleteTreeId: string = '';
  private platform: Platform;
  private deleteAlertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        return false;
      },
    },
    {
      text: 'Confirm',
      role: 'confirm',
      handler: async () => {
        await this.deleteTree();
        return true;
      },
    },
  ];

  constructor(
    platform: Platform,
    private alertController: AlertController,
    private storage: Storage
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

  async getTreeGroups(): Promise<Tree[]> {
    let trees = await this.getTrees();

    trees = trees.filter((x) => x.type === TreeType.Group);

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

    const tree = trees.find(
      (x) => x.id['value'] === (id ?? this.selectedTreeGroup?.id['value'])
    );

    if (this.isWebPlatform && tree) {
      await this.updateImagePaths(tree);
    }

    return tree;
  }

  async getTreesList(groupId?: string): Promise<Tree[]> {
    let trees = await this.getTrees();

    trees = trees.filter(
      (x) =>
        x.type === TreeType.Individual &&
        x.groupId !== undefined &&
        x.groupId['value'] === (groupId ?? this.selectedTreeGroup?.id['value'])
    );

    if (this.isWebPlatform) {
      for (let tree of trees) {
        await this.updateImagePaths(tree);
      }
    }

    return trees;
  }

  async setSelectedTreeGroup(id: string): Promise<void> {
    this.selectedTreeGroup = await this.getSelectedTree(id);
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

  async openDeleteTreeAlert(treeId: string): Promise<void> {
    const trees = await this.getTrees();
    let index = trees.findIndex((x) => x.id['value'] === treeId);

    this.deleteTreeId = treeId;
    const alert = await this.alertController.create({
      header: 'Delete',
      subHeader: `Are you sure you want to delete ${trees[index].title}`,
      message:
        trees[index].type === TreeType.Group
          ? 'Deleting a group also deletes all related trees'
          : '',
      buttons: this.deleteAlertButtons,
    });

    await alert.present();
    await alert.onDidDismiss();
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

  private async getTrees(): Promise<Tree[]> {
    if (this._storage == null) {
      await this.initialiseStorage();
    }

    const value = (await this._storage?.get(this.TREE_STORAGE)) ?? [];
    return (value ? JSON.parse(value) : []) as Tree[];
  }

  private async updateImagePaths(tree: Tree): Promise<void> {
    for (let photo of tree.images) {
      const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data,
      });

      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }

  private async deleteTree(): Promise<void> {
    this.startLoading('Deleting Tree');
    const trees = await this.getTrees();
    let index = trees.findIndex((x) => x.id['value'] === this.deleteTreeId);

    if (trees[index].type === TreeType.Group) {
      let childTrees = trees.filter(
        (x) =>
          x.groupId != undefined &&
          x.groupId['value'] === trees[index].id['value']
      );

      // remove child trees from storage list
      childTrees.map((tree) => {
        let childIndex = trees.findIndex(
          (x) => x.id['value'] === tree.id['value']
        );
        trees.splice(childIndex, 1);

        // Delete all tree images
        for (let i = 0; i < tree.images.length; i++) {
          this.deletePicture(tree.images[i]);
        }
      });
    }

    trees.splice(index, 1);
    await this.saveTrees(trees);
    this.stopLoading();
  }

  private async deletePicture(photo: BoomkykPhoto) {
    // delete photo file from filesystem
    const filename = photo.filepath.substring(
      photo.filepath.lastIndexOf('/') + 1
    );

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
  }
}
