import { ImageType } from './image-type.enum';

export interface BoomkykPhoto {
  filepath: string;
  webviewPath?: string;
  type?: ImageType;
}
