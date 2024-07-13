import { Guid } from 'guid-typescript';
import { BoomkykPhoto } from './photo.interface';
import { TreeType } from './tree-type.enum';
import { VoiceNote } from './voice-notes.interface';

export interface Tree {
  id: Guid;
  title: string;
  type: TreeType;
  groupId?: Guid;
  images?: BoomkykPhoto[];
  voiceNotes?: VoiceNote[];
  treeInfo?: {
    overview: string;
    leaves: string;
    bark: string;
    fruit: string;
    flower: string;
  };
}
