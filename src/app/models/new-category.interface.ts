import { Guid } from 'guid-typescript';
import { NewImage } from './new-image.interface';

export interface NewCategory {
  id: Guid;
  name: string;
  level: number;
  parentId?: Guid;
}

export interface NewCategoryItem {
  id: Guid;
  name: string;
  level: number;
  parentId?: Guid;
  notes: string;
  newCategoryId?: Guid;
  audioFileIds?: Guid[];
  imageIds?: Guid[];
  highlightImageId?: Guid;
  pinIds?: Guid[];
  highlightImage?: NewImage; // used in home page
  createDate?: Date;
}
