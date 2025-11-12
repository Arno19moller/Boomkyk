import { Directory } from '@capacitor/filesystem';

export interface AudioRecording {
  path: string;
  directory: Directory;
  data: string | Blob;
  name: string;
  index: number;
  isPlaying: boolean;
}
