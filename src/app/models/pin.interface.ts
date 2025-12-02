import { Position } from '@capacitor/geolocation';
import { Guid } from 'guid-typescript';

export interface Pin {
  id: Guid;
  date: Date;
  notes: string;
  position?: Position | undefined;
}
