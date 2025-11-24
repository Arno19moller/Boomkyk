import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { TreeType } from '../models/legacy/tree-type.enum';
import { Tree } from '../models/legacy/tree.interface';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class ActionsService {
  private databaseService = inject(DatabaseService);

  public selectedTree: Tree | undefined = undefined;
  private selectedTreeId: string = '';
  private deleteAlertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        return false;
      },
    },
    {
      text: 'Confirm',
      role: 'confirm',
      handler: async () => {
        await this.databaseService.deleteTree(this.selectedTreeId);
        return true;
      },
    },
  ];

  constructor(
    private alertController: AlertController,
    private router: Router,
  ) {}

  public async openDeleteAlert(id?: string): Promise<string | undefined> {
    this.selectedTreeId = id ?? this.selectedTreeId;

    const trees = await this.databaseService.getTrees();
    let index = trees.findIndex((x) => x.id['value'] === this.selectedTreeId);

    const alert = await this.alertController.create({
      header: 'Delete',
      subHeader: `Are you sure you want to delete ${trees[index].title}`,
      message: trees[index].type === TreeType.Family ? 'Deleting a group also deletes all related trees' : '',
      buttons: this.deleteAlertButtons,
    });

    await alert.present();
    const { data, role } = await alert.onWillDismiss();
    return role;
  }

  public async navigateToUpdate(id?: string): Promise<void> {
    this.selectedTree = await this.databaseService.getSelectedTree(id ?? this.selectedTreeId);
    this.router.navigate(['/create']);
  }
}
