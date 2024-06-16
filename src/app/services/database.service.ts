import { Injectable, signal } from '@angular/core';
import { Tree } from '../models/tree.interface';
import { Guid } from 'guid-typescript';
import { TreeType } from '../models/tree-type.enum';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private tempId = Guid.create();
  public treeGroupSignal = signal<Tree[]>([
    {
      id: this.tempId,
      image: [
        {
          filepath:
            'https://www.treetags.co.za/wp-content/uploads/2019/10/marula-tree.jpg',
          webviewPath:
            'https://www.treetags.co.za/wp-content/uploads/2019/10/marula-tree.jpg',
        },
      ],
      title: 'Strychnos Bome',
      subTitle: 'Loganiaceae',
      description:
        'Strychnos is a genus of flowering plants, belonging to the family Loganiaceae (sometimes Strychnaceae).',
      type: TreeType.Group,
    },
    {
      id: Guid.create(),
      image: [
        {
          filepath:
            'https://www.treetags.co.za/wp-content/uploads/2019/10/marula-tree.jpg',
          webviewPath:
            'https://www.treetags.co.za/wp-content/uploads/2019/10/marula-tree.jpg',
        },
      ],
      title: 'Wilde Mispel',
      description: 'Some Description.',
      type: TreeType.List,
      groupId: this.tempId,
      treeInfo: {
        overview: 'Some Overview information about the tree',
        leaves: "Some information about the tree's leaves",
        bark: "Some information about the tree's bark",
        fruit: "Some information about the tree's fruit",
      },
    },
    {
      id: Guid.create(),
      image: [
        {
          filepath:
            'https://www.treetags.co.za/wp-content/uploads/2019/10/marula-tree.jpg',
          webviewPath:
            'https://www.treetags.co.za/wp-content/uploads/2019/10/marula-tree.jpg',
        },
      ],
      title: 'Enkeldoring',
      description: 'Some Description.',
      type: TreeType.List,
      groupId: this.tempId,
      treeInfo: {
        overview: '',
        leaves: '',
        bark: '',
        fruit: '',
      },
    },
  ]);

  selectedTreeGroup: Tree | undefined = undefined;

  constructor() {}

  getTreeGroups(): Tree[] {
    return this.treeGroupSignal().filter((x) => x.type === TreeType.Group);
  }

  getSelectedTree(id?: string): Tree | undefined {
    return this.treeGroupSignal().find(
      (x) => x.id.toString() === (id ?? this.selectedTreeGroup?.id.toString())
    );
  }

  getTreesList(groupId?: string): Tree[] {
    return this.treeGroupSignal().filter(
      (x) =>
        x.type === TreeType.List &&
        x.groupId?.toString() ===
          (groupId ?? this.selectedTreeGroup?.id?.toString())
    );
  }

  setSelectedTreeGroup(id: string): void {
    this.selectedTreeGroup = this.getSelectedTree(id);
  }
}
