import { Position } from '@capacitor/geolocation';
import { BoomkykPhoto } from './photo.interface';
import { VoiceNote } from './voice-notes.interface';

export interface CategoryStructure {
  name: string;
  level: number;
  values: CategoryStructureItem[];
  parent?: CategoryStructure;
  selectedItem?: string; // used in filter

  // Create / update properties
  allowImages: boolean;
  allowNotes: boolean;
  allowLocations: boolean;
}

export interface CategoryStructureItem {
  name: string;
  parent?: CategoryStructureItem;

  // Create / update properties
  images?: BoomkykPhoto[];
  notes?: string;
  locations?: Position[];
  voiceNotes?: VoiceNote[];
}
