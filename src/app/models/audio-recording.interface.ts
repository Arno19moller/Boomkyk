import { Directory } from '@capacitor/filesystem';
import { Guid } from 'guid-typescript';

export interface AudioRecording {
  id: Guid; // new
  //path: string;
  directory: Directory;
  data: string | Blob;
  name: string;
  index: number;
  isPlaying: boolean;
}
