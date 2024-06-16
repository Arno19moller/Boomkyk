import { Guid } from 'guid-typescript';
import { BoomkykPhoto } from './photo.interface';
import { TreeType } from './tree-type.enum';

export interface Tree {
  id: Guid;
  images: BoomkykPhoto[];
  title: string;
  subTitle?: string;
  description: string;
  type: TreeType;
  groupId?: Guid;
  treeInfo?: {
    overview: string;
    leaves: string;
    bark: string;
    fruit: string;
  };
}
