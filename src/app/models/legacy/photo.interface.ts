import { Guid } from 'guid-typescript';
import { ImageType } from './image-type.enum';

export interface BoomkykPhoto {
  id: Guid;
  filepath: string;
  webviewPath?: string;
  type: ImageType;
  timestamp?: Date;
}
