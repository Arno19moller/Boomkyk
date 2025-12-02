import { Guid } from 'guid-typescript';

export interface ItemIndex {
  id: Guid;
  name: string;
  createDate?: Date;
  highlightImageId?: Guid;
  level: number;
  parentId?: Guid;
  newCategoryId?: Guid;
}
