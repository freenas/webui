import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType } from 'app/enums/product-type.enum';
import { shared, helptext_sharing_smb } from 'app/helptext/sharing';
import vol_helptext from 'app/helptext/storage/volumes/volume-list';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { SMBFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import {
  AppLoaderService, DialogService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-smb-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class SMBListComponent implements EntityTableConfig {
  title = 'Samba';
  queryCall: 'sharing.smb.query' = 'sharing.smb.query';
  updateCall: 'sharing.smb.update' = 'sharing.smb.update';
  wsDelete: 'sharing.smb.delete' = 'sharing.smb.delete';
  route_add: string[] = ['sharing', 'smb', 'add'];
  protected route_add_tooltip = 'Add Windows (SMB) Share';
  protected route_delete: string[] = ['sharing', 'smb', 'delete'];
  private entityList: EntityTableComponent;
  productType = window.localStorage.getItem('product_type') as ProductType;
  emptyTableConfigMessages = {
    first_use: {
      title: T('No SMB Shares'),
      message: T('It seems you haven\'t setup any SMB Shares yet. Please click the button below to add an SMB Share.'),
    },
    no_page_data: {
      title: T('No SMB Shares'),
      message: T('The system could not retrieve any SMB Shares from the database. Please click the button below to add an SMB Share.'),
    },
    buttonText: T('Add SMB Share'),
  };

  columns = [
    { name: helptext_sharing_smb.column_name, prop: 'name', always_display: true },
    { name: helptext_sharing_smb.column_path, prop: 'path' },
    { name: helptext_sharing_smb.column_comment, prop: 'comment' },
    { name: helptext_sharing_smb.column_enabled, prop: 'enabled', checkbox: true },
  ];
  rowIdentifier = 'cifs_name';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Windows (SMB) Share',
      key_props: ['name'],
    },
  };

  confirmDeleteDialog = {
    message: shared.delete_share_message,
    isMessageComplete: true,
    button: T('Unshare'),
    buildTitle: (share: SmbShare) => `${T('Unshare')} ${share.name}`,
  };

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private dialog: DialogService,
    private translate: TranslateService,
    private modalService: ModalService,
    private loader: AppLoaderService,
    private sysGeneralService: SystemGeneralService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;

    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  doAdd(id?: number): void {
    this.modalService.open('slide-in-form', new SMBFormComponent(this.router, this.ws, this.dialog, this.loader, this.sysGeneralService, this.modalService), id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }

  getActions(row: SmbShare): EntityTableAction[] {
    const rowName = row.path.replace('/mnt/', '');
    const poolName = rowName.split('/')[0];
    let optionDisabled;
    rowName.includes('/') ? optionDisabled = false : optionDisabled = true;
    return [
      {
        id: row.name,
        icon: 'edit',
        name: 'edit',
        label: T('Edit'),
        onClick: (row: any) => this.entityList.doEdit(row.id),
      },
      {
        id: row.name,
        icon: 'security',
        name: 'share_acl',
        label: helptext_sharing_smb.action_share_acl,
        onClick: (row: any) => {
          this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe(
            (res) => {
              if (res) {
                this.lockedPathDialog(row.path);
              } else {
                // A home share has a name (homes) set; row.name works for other shares
                const searchName = row.home ? 'homes' : row.name;
                this.ws.call('smb.sharesec.query', [[['share_name', '=', searchName]]]).pipe(untilDestroyed(this)).subscribe(
                  (res: any) => {
                    this.router.navigate(
                      ['/'].concat(['sharing', 'smb', 'acl', res[0].id]),
                    );
                  },
                );
              }
            },
          );
        },
      },
      {
        id: row.name,
        icon: 'security',
        name: 'edit_acl',
        disabled: optionDisabled,
        matTooltip: vol_helptext.acl_edit_msg,
        label: helptext_sharing_smb.action_edit_acl,
        onClick: (row: any) => {
          const datasetId = rowName;
          this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe(
            (res) => {
              if (res) {
                this.lockedPathDialog(row.path);
              } else if (this.productType.includes(ProductType.Scale)) {
                this.router.navigate(
                  ['/'].concat(['storage', 'id', poolName, 'dataset', 'posix-acl', datasetId]),
                );
              } else {
                this.router.navigate(
                  ['/'].concat(['storage', 'pools', 'id', poolName, 'dataset', 'acl', datasetId]),
                );
              }
            }, (err) => {
              this.dialog.errorReport(helptext_sharing_smb.action_edit_acl_dialog.title,
                err.reason, err.trace.formatted);
            },
          );
        },
      },
      {
        id: row.name,
        icon: 'delete',
        name: 'delete',
        label: T('Delete'),
        onClick: (row: any) => this.entityList.doDelete(row),
      },
    ] as EntityTableAction[];
  }

  lockedPathDialog(path: string): void {
    const thePath = this.translate.instant(helptext_sharing_smb.action_edit_acl_dialog.message1);
    const isInALockedDataset = this.translate.instant(helptext_sharing_smb.action_edit_acl_dialog.message2);
    this.dialog.errorReport(helptext_sharing_smb.action_edit_acl_dialog.title, `${thePath} <i>${path}</i> ${isInALockedDataset}`);
  }

  onCheckboxChange(row: SmbShare): void {
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled }]).pipe(untilDestroyed(this)).subscribe(
      (res: any) => {
        row.enabled = res.enabled;
        if (!res) {
          row.enabled = !row.enabled;
        }
      },
      (err) => {
        row.enabled = !row.enabled;
        new EntityUtils().handleWSError(this, err, this.dialog);
      },
    );
  }
}
