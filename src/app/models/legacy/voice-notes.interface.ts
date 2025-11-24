import { ImageType } from './image-type.enum';

export interface VoiceNote {
  recordingName: string;
  type: ImageType;
  isPlaying: boolean;
}
