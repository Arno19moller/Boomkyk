import { Directory } from '@capacitor/filesystem';

export interface AudioRecording {
  path: string;
  directory: Directory;
  data: string | Blob;
  name: string;
  isPlaying: boolean;
}
