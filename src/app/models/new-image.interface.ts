import { Guid } from 'guid-typescript';

export interface NewImage {
  id: Guid;
  format: string;
  webPath: string;
  // webviewPath: string;
  isHighlight: boolean;
}
