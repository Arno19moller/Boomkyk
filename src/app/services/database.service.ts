import { Injectable, signal } from '@angular/core';
import { Tree } from '../models/tree.interface';
import { Guid } from 'guid-typescript';
import { TreeType } from '../models/tree-type.enum';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public isWebPlatform: boolean = false;

  private TREE_STORAGE: string = 'trees';
  private selectedTreeGroup: Tree | undefined = undefined; // used when navigating back
  private deleteTreeId: string = '';
  private platform: Platform;
  private alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Alert canceled');
      },
    },
    {
      text: 'Confirm',
      role: 'confirm',
      handler: async () => {
        const trees = await this.getTrees();
        let index = trees.findIndex((x) => x.id['value'] === this.deleteTreeId);

        if (trees[index].type === TreeType.Group) {
          let childTrees = trees.filter(
            (x) =>
              x.groupId != undefined &&
              x.groupId['value'] === trees[index].id['value']
          );
          childTrees.map((tree) => {
            let childIndex = trees.findIndex(
              (x) => x.id['value'] === tree.id['value']
            );
            trees.splice(childIndex, 1);
          });
        }

        trees.splice(index, 1);
        this.saveTrees(trees);
      },
    },
  ];

  constructor(platform: Platform, private alertController: AlertController) {
    this.platform = platform;
    this.isWebPlatform = !this.platform.is('hybrid');
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
    const trees = await this.getTrees();
    trees.push(tree);
    this.saveTrees(trees);
  }

  async updateTree(tree: Tree): Promise<void> {
    const trees = await this.getTrees();
    let index = trees.findIndex((x) => x.id['value'] === tree.id['value']);
    trees[index] = tree;

    this.saveTrees(trees);
  }

  async deleteTree(treeId: string): Promise<void> {
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
      buttons: this.alertButtons,
    });

    await alert.present();
  }

  // private
  private saveTrees(trees: Tree[]): void {
    Preferences.set({
      key: this.TREE_STORAGE,
      value: JSON.stringify(trees),
    });
  }

  private async getTrees(): Promise<Tree[]> {
    const { value } = await Preferences.get({ key: this.TREE_STORAGE });
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
}
