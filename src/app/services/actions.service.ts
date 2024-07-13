import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { TreeType } from '../models/tree-type.enum';
import { Tree } from '../models/tree.interface';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class ActionsService {
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
  private actionSheetButtons = [
    {
      text: 'Edit',
      icon: 'create',
      data: {
        action: 'edit',
      },
      handler: async () => {
        await this.navigateToUpdate();
      },
    },
    {
      text: 'Delete',
      role: 'destructive',
      icon: 'trash',
      data: {
        action: 'delete',
      },
      handler: async () => {
        await this.openDeleteConfirmation();
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
      data: {
        action: 'cancel',
      },
    },
  ];

  constructor(
    private databaseService: DatabaseService,
    private alertController: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private router: Router,
  ) {}

  public async openEditOrDeleteModal(id: string): Promise<void> {
    this.selectedTreeId = id;
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Actions',
      buttons: this.actionSheetButtons,
    });

    await actionSheet.present();
    await actionSheet.onDidDismiss();
  }

  public async navigateToUpdate(id?: string): Promise<void> {
    this.selectedTree = await this.databaseService.getSelectedTree(id ?? this.selectedTreeId);
    this.router.navigate(['/create']);
  }

  public async openDeleteConfirmation(id?: string): Promise<string | undefined> {
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
}
