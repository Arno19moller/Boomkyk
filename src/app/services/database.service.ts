import { Injectable, signal } from '@angular/core';
import { Tree } from '../models/tree.interface';
import { Guid } from 'guid-typescript';
import { TreeType } from '../models/tree-type.enum';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { image } from 'ionicons/icons';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public isWebPlatform: boolean = false;
  private TREE_STORAGE: string = 'trees';
  private selectedTreeGroup: Tree | undefined = undefined; // used when navigating back
  private platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
    this.isWebPlatform = !this.platform.is('hybrid');
  }

  async getTreeGroups(): Promise<Tree[]> {
    const { value } = await Preferences.get({ key: this.TREE_STORAGE });
    let trees = (value ? JSON.parse(value) : []) as Tree[];

    trees = trees.filter((x) => x.type === TreeType.Group);

    // Only for web
    if (this.isWebPlatform) {
      for (let tree of trees) {
        for (let photo of tree.images) {
          const readFile = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });

          photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
        }
      }
    }

    return trees;
  }

  async getSelectedTree(id?: string): Promise<Tree | undefined> {
    const { value } = await Preferences.get({ key: this.TREE_STORAGE });
    const trees = (value ? JSON.parse(value) : []) as Tree[];

    const tree = trees.find(
      (x) => x.id['value'] === (id ?? this.selectedTreeGroup?.id['value'])
    );

    if (this.isWebPlatform && tree) {
      for (let photo of tree.images) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });

        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }

    return tree;
  }

  async getTreesList(groupId?: string): Promise<Tree[]> {
    const { value } = await Preferences.get({ key: this.TREE_STORAGE });
    let trees = (value ? JSON.parse(value) : []) as Tree[];

    trees = trees.filter(
      (x) =>
        x.type === TreeType.Individual &&
        x.groupId !== undefined &&
        x.groupId['value'] === (groupId ?? this.selectedTreeGroup?.id['value'])
    );

    if (this.isWebPlatform) {
      for (let tree of trees) {
        for (let photo of tree.images) {
          const readFile = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });

          photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
        }
      }
    }

    return trees;
  }

  async setSelectedTreeGroup(id: string): Promise<void> {
    this.selectedTreeGroup = await this.getSelectedTree(id);
  }

  async addTree(tree: Tree): Promise<void> {
    const { value } = await Preferences.get({ key: this.TREE_STORAGE });
    const trees = (value ? JSON.parse(value) : []) as Tree[];
    trees.push(tree);

    Preferences.set({
      key: this.TREE_STORAGE,
      value: JSON.stringify(trees),
    });
  }
}
