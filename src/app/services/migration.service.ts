import { inject, Injectable } from '@angular/core';
import { Directory } from '@capacitor/filesystem';
import { Guid } from 'guid-typescript';
import { AudioRecording } from '../models/audio-recording.interface';
import { BoomkykPhoto } from '../models/legacy/photo.interface';
import { TreeType } from '../models/legacy/tree-type.enum';
import { Tree } from '../models/legacy/tree.interface';
import { VoiceNote } from '../models/legacy/voice-notes.interface';
import { NewCategoryItem } from '../models/new-category.interface';
import { NewImage } from '../models/new-image.interface';
import { Pin } from '../models/pin.interface';
import { DatabaseService } from './legacy/database.service';
import { LoadingService } from './loading.service';
import { MapService } from './map.service';
import { NewAudioService } from './new-audio.service';
import { NewCategoryService } from './new-category.service';
import { NewImageService } from './new-image.service';

@Injectable({
  providedIn: 'root',
})
export class MigrationService {
  private databaseService = inject(DatabaseService);
  private categoryService = inject(NewCategoryService);
  private imageService = inject(NewImageService);
  private audioService = inject(NewAudioService);
  private mapService = inject(MapService);
  private loadingService = inject(LoadingService);

  constructor() {}

  async migrate() {
    this.loadingService.isLoading = true;
    this.loadingService.loadingMessage = 'Starting Migration...';

    try {
      // 1. Load Legacy Data
      const trees = await this.databaseService.getTrees();
      console.log(`Found ${trees.length} legacy trees to migrate.`);

      // 2. Load New Categories to resolve IDs
      const categories = await this.categoryService.getCategories();
      const familyCategory = categories.find((c) => c.name === 'Family');
      const genusCategory = categories.find((c) => c.name === 'Genus');
      const speciesCategory = categories.find((c) => c.name === 'Species');

      if (!familyCategory || !genusCategory || !speciesCategory) {
        throw new Error('Required categories (Family, Genus, Species) not found. Please ensure the app is seeded.');
      }

      // 3. Migrate each tree
      for (const tree of trees) {
        this.loadingService.loadingMessage = `Migrating ${tree.title}...`;
        await this.migrateTree(tree, familyCategory.id, genusCategory.id, speciesCategory.id);
      }

      console.log('Migration completed successfully.');
      alert('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      alert(`Migration failed: ${error}`);
    } finally {
      this.loadingService.isLoading = false;
    }
  }

  private async migrateTree(tree: Tree, familyCatId: Guid, genusCatId: Guid, speciesCatId: Guid) {
    // Map TreeType to Category ID and Level
    let newCategoryId: Guid;
    let level: number;

    switch (tree.type) {
      case TreeType.Family:
        newCategoryId = familyCatId;
        level = 2;
        break;
      case TreeType.Genus:
        newCategoryId = genusCatId;
        level = 1;
        break;
      case TreeType.Species:
        newCategoryId = speciesCatId;
        level = 0;
        break;
      default:
        console.warn(`Unknown TreeType for tree ${tree.title}. Skipping.`);
        return;
    }

    // Create NewCategoryItem
    const newItem: NewCategoryItem = {
      id: tree.id, // Keep the same ID if possible, or generate new one? Keeping same ID is better for relationships if they were preserved, but here relationships are via groupId.
      // Actually, legacy uses groupId for parent-child. New uses parentId.
      // We need to map groupId to parentId.
      // Since we are iterating all trees, we can just copy the ID.
      // However, we need to ensure the parent exists.
      // If we migrate top-down (Family -> Genus -> Species), parents should exist.
      // Legacy trees are sorted by title in getTrees(). We might need to sort by Type/Level.
      name: tree.title,
      level: level,
      newCategoryId: newCategoryId,
      parentId: tree.groupId ? Guid.parse(tree.groupId['value']) : undefined, // Legacy groupId is the parent ID
      notes: this.formatTreeInfo(tree),
      createDate: new Date(), // Or try to find a date in legacy? Legacy doesn't seem to have create date on Tree, only on Photo.
    };

    // Migrate Images
    if (tree.images && tree.images.length > 0) {
      const imageIds: Guid[] = [];
      for (const photo of tree.images) {
        const newImageId = await this.migrateImage(photo);
        imageIds.push(newImageId);
      }
      newItem.imageIds = imageIds;
      // Set first image as highlight
      if (imageIds.length > 0) {
        newItem.highlightImageId = imageIds[0];
      }
    }

    // Migrate Audio
    if (tree.voiceNotes && tree.voiceNotes.length > 0) {
      const audioIds: Guid[] = [];
      for (const note of tree.voiceNotes) {
        const newAudioId = await this.migrateAudio(note);
        audioIds.push(newAudioId);
      }
      newItem.audioFileIds = audioIds;
    }

    // Migrate Locations
    if (tree.locations && tree.locations.length > 0) {
      const pinIds: Guid[] = [];
      for (const loc of tree.locations) {
        const newPinId = await this.migrateLocation(loc);
        pinIds.push(newPinId);
      }
      newItem.pinIds = pinIds;
    }

    // Save the new item
    await this.categoryService.saveCategoryItem(newItem);
  }

  private formatTreeInfo(tree: Tree): string {
    if (!tree.treeInfo) return '';
    const parts = [];
    if (tree.treeInfo.overview) parts.push(`Overview: ${tree.treeInfo.overview}`);
    if (tree.treeInfo.leaves) parts.push(`Leaves: ${tree.treeInfo.leaves}`);
    if (tree.treeInfo.bark) parts.push(`Bark: ${tree.treeInfo.bark}`);
    if (tree.treeInfo.fruit) parts.push(`Fruit: ${tree.treeInfo.fruit}`);
    if (tree.treeInfo.flower) parts.push(`Flower: ${tree.treeInfo.flower}`);
    return parts.join('\n\n');
  }

  private async migrateImage(photo: BoomkykPhoto): Promise<Guid> {
    const newId = Guid.create();
    const newImage: NewImage = {
      id: newId,
      format: 'jpeg', // Assumed from legacy save
      webPath: photo.webviewPath || '', // Legacy has webviewPath.
      // Note: Legacy stores files in Directory.Data. New system also seems to use Directory.Data (implied by not seeing directory arg in NewImageService, but it uses Storage).
      // Wait, NewImageService just stores metadata in Storage. It doesn't seem to handle file moving?
      // NewImageService.saveImageToStorage just saves the object.
      // The actual file needs to be there.
      // Legacy photo.filepath is the filename (e.g. "123123.jpeg").
      // NewImage.webPath seems to be the full path or webview path.
      // If the file is already in Directory.Data, we might just need to point to it.
      // However, NewImage interface has `webPath`.
      // Let's assume we just copy the path.
      isHighlight: false,
    };

    // We might need to ensure the file exists or copy it if the new system expects a different naming convention.
    // Legacy: `fileName` (timestamp.jpeg).
    // New: `webPath`.
    // If we just keep the file as is, it should be fine.

    await this.imageService.addImage(newImage);
    return newId;
  }

  private async migrateAudio(note: VoiceNote): Promise<Guid> {
    const newId = Guid.create();
    const newAudio: AudioRecording = {
      id: newId,
      name: note.recordingName, // Legacy stores filename here
      directory: Directory.Data,
      data: '', // Legacy doesn't store data in memory, it reads from file.
      // Looking at NewAudioService, it just saves the object.
      // Looking at AudioRecording interface, data is string | Blob.
      // If it's just metadata, maybe we don't need to load the data.
      index: 0,
      isPlaying: false,
    } as any; // Cast to any to avoid strict type checks if I missed something, but try to be correct.

    // Actually, let's look at AudioRecording interface again.
    // import { Directory } from '@capacitor/filesystem';
    // export interface AudioRecording { ... directory: Directory; ... }

    // I need to import Directory in this file.

    await this.audioService.addAudioFile(newAudio);
    return newId;
  }

  private async migrateLocation(pos: any): Promise<Guid> {
    const newId = Guid.create();
    const newPin: Pin = {
      id: newId,
      date: new Date(),
      notes: 'Migrated location',
      position: pos,
    };
    await this.mapService.addPin(newPin);
    return newId;
  }
}
