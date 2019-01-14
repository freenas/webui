import { Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityTableComponent, InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/downloadkey/downloadkey-dialog.component';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material';
import * as moment from 'moment';
import {TreeNode} from 'primeng/api';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';

import { ErdService } from 'app/services/erd.service';
import { T } from '../../../../translate-marker';
import { StorageService } from '../../../../services/storage.service';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import helptext from '../../../../helptext/storage/volumes/volume-list';

import { CoreService } from 'app/core/services/core.service';

export interface ZfsPoolData {
  avail?: number;
  availStr?: string;
  id?: string;
  is_decrypted?: boolean;
  is_upgraded?: boolean;
  mountpoint?: string;
  name?: string;
  path?: string;
  nodePath?: string;
  parentPath?: string;
  status?: string;
  used?: number;
  used_pct?: string;
  usedStr?: string;
  sed_pct?: string;
  vol_encrypt?: number;
  vol_encryptkey?: string;
  vol_guid?: string;
  vol_name?: string;
  type?: string;
  compression?: string;
  dedup?: string;
  readonly?: string;
  children?: any[];
  dataset_data?: any;
  actions?: any[];
  comments?: string;
  compressionRatio?: any;
  volumesListTableConfig?: VolumesListTableConfig;
}

export class VolumesListTableConfig implements InputTableConf {
  public hideTopActions = true;
  public flattenedVolData: any;
  public resource_name = 'storage/volume';
  public tableData: TreeNode[] = [];
  public columns: Array < any > = [
    { name: 'Name', prop: 'name', },
    { name: 'Type', prop: 'type', },
    { name: 'Used', prop: 'used', filesizePipe: true},
    { name: 'Available', prop: 'avail', filesizePipe: true},
    { name: 'Compression', prop: 'compression', },
    { name: 'Compression Ratio', prop: 'compressratio', },
    { name: 'Readonly', prop: 'readonly', },
    { name: 'Dedup', prop: 'dedup', },
    { name: 'Comments', prop: 'comments', },
  ];
  protected dialogRef: any;
  public route_add = ["storage", "pools", "import"];
  public route_add_tooltip = T("Create or Import Pool");
  public showDefaults: boolean = false;
  public showSpinner:boolean;
  public encryptedStatus: any;
  public custActions: Array<any> = [];

  constructor(
    private parentVolumesListComponent: VolumesListComponent,
    private _router: Router,
    private _classId: string,
    private title: string,
    private datasetData: Object,
    public mdDialog: MatDialog,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected translate: TranslateService,
    protected snackBar: MatSnackBar
  ) {

    if (typeof (this._classId) !== "undefined" && this._classId !== "") {
      const resource_name = this.resource_name + "/" + this._classId;

      this.rest.get(resource_name, {}).subscribe((res) => {
        this.tableData = [];
        for (let i = 0; i < res.data.children.length; i++) {
          this.tableData.push(this.dataHandler(res.data.children[i]));
        }
      }, (res) => {
        this.dialogService.errorReport(T("Error getting pool or dataset data."), res.message, res.stack);
      });
    }
  }

  isCustActionVisible(actionname: string) {
    if (actionname === 'download_key' && this.encryptedStatus !== '') {
      return true;
    } else {
      return false;
    }
  }

  getEncryptedActions(rowData: any) {
    const actions = [];

    if (rowData.vol_encrypt === 2) {

      if (rowData.is_decrypted) {
        actions.push({
          label: T("Lock"),
          onClick: (row1) => {
            this.dialogService.confirm(T("Lock Pool"), T("Lock ") + row1.name + "?").subscribe((confirmResult) => {
              if (confirmResult === true) {
                this.loader.open();
                this.rest.post(this.resource_name + "/" + row1.name + "/lock/", { body: JSON.stringify({}) }).subscribe((restPostResp) => {
                  this.loader.close();
                  this.parentVolumesListComponent.repaintMe();

                }, (res) => {
                  this.loader.close();
                  this.dialogService.errorReport(T("Error locking pool."), res.message, res.stack);
                });
              }
            });
          }
        });

      } else {
        actions.push({
          label: T("Unlock"),
          onClick: (row1) => {
            this.unlockAction(row1);
          }
        });
      }

      if (rowData.is_decrypted) {
        actions.push({
          label: T("Change Passphrase"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat(
              ["storage", "pools", "changekey", row1.id]));
          }
        });
      }

    } else if (rowData.vol_encrypt === 1 && rowData.is_decrypted) {
      actions.push({
        label: T("Create Passphrase"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "createkey", row1.id]));
        }
      });
    }

    if (rowData.is_decrypted) {

      actions.push({
        label: T("Add Recovery Key"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "addkey", row1.id]));
        }
      });

      actions.push({
        label: T("Delete Recovery Key"),
        onClick: (row1) => {
          this.dialogService.confirm(T("Delete Recovery Key"), T("Delete recovery key for ") + row1.name + "?").subscribe((confirmResult) => {
            if (confirmResult === true) {
              this.loader.open();

              this.rest.delete(this.resource_name + "/" + row1.id + "/recoverykey/", { body: JSON.stringify({}) }).subscribe((restPostResp) => {
                this.loader.close();

                this.dialogService.Info(T("Deleted Recovery Key"), T("Successfully deleted recovery key for ") + row1.name).subscribe((infoResult) => {
                  this.parentVolumesListComponent.repaintMe();
                });
              }, (res) => {
                this.loader.close();
                this.dialogService.errorReport(T("Error Deleting Key"), res.message, res.stack);
              });
            }
          });
        }
      });

      actions.push({
        label: T("Encryption Rekey"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "rekey", row1.id]));

        }
      });

      actions.push({
        label: T("Download Encrypt Key"),
        onClick: (row1) => {
          const dialogRef = this.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });
          dialogRef.componentInstance.volumeId = row1.id;

        }
      });
    }

    return actions;
  }

  unlockAction(row1) {
    let localLoader = this.loader,
    localRest = this.rest,
    localParentVol = this.parentVolumesListComponent,
    localDialogService = this.dialogService,
    localSnackBar = this.snackBar;

    const conf: DialogFormConfiguration = {
      title: "Unlock " + row1.name,
      fieldConfig: [{
        type : 'input',
        inputType: 'password',
        name : 'passphrase',
        togglePw: true,
        placeholder: helptext.unlockDialog_password_placeholder,
      },
      {
        type: 'input',
        name: 'recovery_key',
        placeholder: helptext.unlockDialog_recovery_key_placeholder,
        tooltip: helptext.unlockDialog_recovery_key_tooltip,
        inputType: 'file',
        fileType: 'binary'
      },
      {
        type: 'select',
        name: 'services',
        placeholder: helptext.unlockDialog_services_placeholder,
        tooltip: helptext.unlockDialog_services_tooltip,
        multiple: true,
        value: ['afp','cifs','ftp','iscsitarget','nfs','webdav','jails'],
        options: [{label: 'AFP', value: 'afp'},
                 {label: 'SMB', value: 'cifs'},
                 {label: 'FTP', value: 'ftp'},
                 {label: 'iSCSI', value: 'iscsitarget'},
                 {label: 'NFS', value: 'nfs'},
                 {label: 'WebDAV', value: 'webdav'},
                 {label: 'Jails/Plugins', value: 'jails'}]
      }
      ],

      saveButtonText: T("Unlock"),
      customSubmit: function (entityDialog) {
        const value = entityDialog.formValue;
        localLoader.open();
        return localRest.post("storage/volume/" + row1.name + "/unlock/",
          { body: JSON.stringify({
             passphrase: value.passphrase,
             recovery_key: value.recovery_key,
             services: value.services
            }) 
          }).subscribe((restPostResp) => {
          entityDialog.dialogRef.close(true);
          localLoader.close();
          localParentVol.repaintMe();
          localSnackBar.open(row1.name + " has been unlocked.", 'close', { duration: 5000 });
        }, (res) => {
          localLoader.close();
          localDialogService.errorReport(T("Error Unlocking"), res.error, res.stack);
        });
      }
    }
    this.dialogService.dialogForm(conf);
  }

  getPoolData(poolId: number) {
    return this.ws.call('pool.query', [
      [
        ["id", "=", poolId]
      ]
    ]);
  }

  getActions(rowData: any) {
    let rowDataPathSplit = [];
    if (rowData.path) {
      rowDataPathSplit = rowData.path.split('/');
    }
    const actions = [];
    //workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (rowData.type === 'zpool') {

      actions.push({
        label: T("Export/Disconnect"),
        onClick: (row1) => {

          let encryptedStatus = row1.vol_encryptkey,
            localParentVol = this.parentVolumesListComponent,
            localDialogService = this.dialogService,
            localDialog = this.mdDialog

          const conf: DialogFormConfiguration = { 
            title: "Export/disconnect pool: '" + row1.name + "'",
            fieldConfig: [{
              type: 'paragraph',
              name: 'pool_detach_warning',
              paraText: helptext.detachDialog_pool_detach_warning_paratext_a + row1.name +
                helptext.detachDialog_pool_detach_warning_paratext_b,
              isHidden: false
            }, {
              type: 'paragraph',
              name: 'pool_detach_warning',
              paraText: "'" + row1.name + helptext.detachDialog_pool_detach_warning__encrypted_paratext,
              isHidden: encryptedStatus !== '' ? false : true
            }, {
              type: 'checkbox',
              name: 'destroy',
              value: false,
              placeholder: helptext.detachDialog_pool_detach_destroy_checkbox_placeholder,
            }, {
              type: 'checkbox',
              name: 'cascade',
              value: true,
              placeholder: helptext.detachDialog_pool_detach_cascade_checkbox_placeholder,
            }, {
              type: 'checkbox',
              name: 'confirm',
              placeholder: helptext.detachDialog_pool_detach_confim_checkbox_placeholder,
              required: true
            }],
            isCustActionVisible(actionId: string) {
              if (actionId == 'download_key' && encryptedStatus === '') {
                return false;
              } else {
                return true;
              }
            },
            saveButtonText: T('Export/Disconnect'),
            custActions: [
              {
                id: 'download_key',
                name: 'Download Key',
                function: () => {
                  const dialogRef = this.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });
                  dialogRef.componentInstance.volumeId = row1.id;
                }
              }],
            customSubmit: function (entityDialog) {
              const value = entityDialog.formValue;

              let dialogRef = localDialog.open(EntityJobComponent, {data: {"title":"Exporting Pool"}, disableClose: true});
              dialogRef.componentInstance.setDescription(T("Exporting Pool..."));
              dialogRef.componentInstance.setCall("pool.export", [row1.id, { destroy: value.destroy, cascade: value.cascade }]);
              dialogRef.componentInstance.submit();
              dialogRef.componentInstance.success.subscribe(res=>{
                entityDialog.dialogRef.close(true);
                if (!value.destroy) {
                  localDialogService.Info(T("Export/Disconnect Pool"), T("Successfully exported/disconnected '") + row1.name + "'");
                } else {
                  localDialogService.Info(T("Export/Disconnect Pool"), T("Successfully exported/disconnected '") + row1.name +
                  T("'. All data on that pool was destroyed."));
                }
                dialogRef.close(true);
                localParentVol.repaintMe();
              }),
              dialogRef.componentInstance.failure.subscribe((res) => {
                dialogRef.close(false);
                localDialogService.errorReport(T("Error exporting/disconnecting pool."), res.error, res.exception);
              });
            }
            
          }
          this.dialogService.dialogForm(conf);
        }
      });

      if (rowData.is_decrypted) {
        actions.push({
          label: T("Extend"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat(
              ["storage", "pools", "manager", row1.id]));
          }
        });
        actions.push({
          label: T("Scrub Pool"),
          onClick: (row1) => {
            this.getPoolData(row1.id).subscribe((res) => {
              if (res[0]) {
                if (res[0].scan.function === "SCRUB" && res[0].scan.state === "SCANNING") {
                  const message = "Stop the scrub on " + row1.name + "?";
                  this.dialogService.confirm("Scrub Pool", message, false, T("Stop Scrub")).subscribe((res) => {
                    if (res) {
                      this.loader.open();
                      this.rest.delete("storage/volume/" + row1.id + "/scrub/", { body: JSON.stringify({}) }).subscribe(
                        (res) => {
                          this.loader.close();
                          this.snackBar.open(res.data, 'close', { duration: 5000 });
                        },
                        (res) => {
                          this.loader.close();
                          new EntityUtils().handleError(this, res);
                        });
                    }
                  });
                } else {
                  const message = "Start a scrub on " + row1.name + "?";
                  this.dialogService.confirm("Scrub Pool", message, false, T("Start Scrub")).subscribe((res) => {
                    if (res) {
                      this.loader.open();
                      this.rest.post("storage/volume/" + row1.id + "/scrub/", { body: JSON.stringify({}) }).subscribe(
                        (res) => {
                          this.loader.close();
                          this.snackBar.open(res.data, 'close', { duration: 5000 });
                        },
                        (res) => {
                          this.loader.close();
                          new EntityUtils().handleError(this, res);
                        });
                    }
                  });
                }
              }
            })
          }
        });
        actions.push({
          label: T("Status"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat(
              ["storage", "pools", "status", row1.id]));
          }
        });

        if (rowData.is_upgraded === false) {

          actions.push({
            label: T("Upgrade Pool"),
            onClick: (row1) => {

              this.dialogService.confirm(T("Upgrade Pool"), helptext.upgradePoolDialog_warning + row1.name).subscribe((confirmResult) => {
                  if (confirmResult === true) {
                    this.loader.open();

                    this.rest.post("storage/volume/" + row1.id + "/upgrade", { body: JSON.stringify({}) }).subscribe((restPostResp) => {
                      this.loader.close();

                      this.dialogService.Info(T("Upgraded"), T("Successfully Upgraded ") + row1.name).subscribe((infoResult) => {
                        this.parentVolumesListComponent.repaintMe();
                      });
                    }, (res) => {
                      this.loader.close();
                      this.dialogService.errorReport(T("Error Upgrading Pool ") + row1.name, res.message, res.stack);
                    });
                  }
                });

            }
          });
        }
      }
    }

    if (rowData.type === "dataset") {
      actions.push({
        label: T("Add Dataset"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "dataset",
            "add", row1.path
          ]));
        }
      });
      actions.push({
        label: T("Add Zvol"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "zvol", "add",
            row1.path
          ]));
        }
      });
      actions.push({
        label: T("Edit Options"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "dataset",
            "edit", row1.path
          ]));
        }
      });
      if (rowDataPathSplit[1] !== "iocage") {
        actions.push({
          label: T("Edit Permissions"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat([
              "storage", "pools", "id", row1.path.split('/')[0], "dataset",
              "permissions", row1.path
            ]));
          }
        });
      }

      if (rowData.path.indexOf('/') !== -1) {
        actions.push({
          label: T("Delete Dataset"),
          onClick: (row1) => {

            this.dialogService.confirm(T("Delete"), T("This action is irreversible and will \
             delete any existing snapshots of this dataset (" + row1.path + ").  Please confirm."), false, T('Delete Dataset')).subscribe((res) => {
                if (res) {

                  this.loader.open();

                  const url = "storage/dataset/" + row1.path;


                  this.rest.delete(url, {}).subscribe((res) => {
                    this.loader.close();
                    this.parentVolumesListComponent.repaintMe();
                  }, (error) => {
                    this.loader.close();
                    this.dialogService.errorReport(T("Error deleting dataset."), error.message, error.stack);
                  });

                }
              });
          }
        });

      }


    }
    if (rowData.type === "zvol") {
      actions.push({
        label: T("Delete zvol"),
        onClick: (row1) => {
          this.dialogService.confirm(T("Delete zvol:" + row1.path), T("Please confirm the deletion of zvol:" + row1.path), false, T('Delete Zvol')).subscribe((confirmed) => {
            if (confirmed === true) {
              this.loader.open();

              this.ws.call('pool.dataset.delete', [row1.path]).subscribe((wsResp) => {
                this.loader.close();
                this.parentVolumesListComponent.repaintMe();

              }, (res) => {
                this.loader.close();
                this.dialogService.errorReport(T("Error Deleting zvol ") + row1.path, res.reason, res.stack);
              });
            }
          });

        }
      });
      actions.push({
        label: T("Edit Zvol"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "zvol", "edit",
            row1.path
          ]));
        }
      });


    }
    if (rowData.type === "zvol" || rowData.type === "dataset") {
      actions.push({
        label: T("Create Snapshot"),
        onClick: (row) => {
          const conf: DialogFormConfiguration = {
            title: "One time snapshot of " + row.path,
            fieldConfig: [
              {
                type: 'input',
                name: 'dataset',
                placeholder: helptext.snapshotDialog_dataset_placeholder,
                value: row.path,
                isHidden: true,
                readonly: true
              },
              {
                type: 'input',
                name: 'name',
                placeholder: helptext.snapshotDialog_name_placeholder,
                tooltip: helptext.snapshotDialog_name_tooltip,
                validation: helptext.snapshotDialog_name_validation,
                required: true,
                value: "manual" + '-' + this.getTimestamp()            },
              {
                type: 'checkbox',
                name: 'recursive',
                placeholder: helptext.snapshotDialog_recursive_placeholder,
                tooltip: helptext.snapshotDialog_recursive_tooltip,
              }
            ],
            method_rest: "storage/snapshot",
            saveButtonText: T("Create Snapshot"),
          }
          this.ws.call('vmware.query',[[["filesystem", "=", row.path]]]).subscribe((vmware_res)=>{
            if(vmware_res.length !== 0){
              const vmware_cb = {
                type: 'checkbox',
                name: 'vmware_sync',
                placeholder: helptext.vmware_sync_placeholder,
                tooltip: helptext.vmware_sync_tooltip,
              }
              conf.fieldConfig.push(vmware_cb);
            }
            this.dialogService.dialogForm(conf).subscribe((res) => {
              if (res) {
                this.snackBar.open(T("Snapshot successfully taken."), T('close'), { duration: 5000 });
              }
            });
          })
        }
      });

      let rowDataset = _.find(this.datasetData, { id: rowData.path });
      if (rowDataset && rowDataset['origin'] && !!rowDataset['origin'].parsed) {
        actions.push({
          label: T("Promote Dataset"),
          onClick: (row1) => {
            this.loader.open();

            this.ws.call('pool.dataset.promote', [row1.path]).subscribe((wsResp) => {
              this.loader.close();
              // Showing info here because there is no feedback on list parent for this if promoted.
              this.dialogService.Info(T("Promote Dataset"), T("Successfully Promoted ") + row1.path).subscribe((infoResult) => {
                this.parentVolumesListComponent.repaintMe();
              });
            }, (res) => {
              this.loader.close();
              this.dialogService.errorReport(T("Error Promoting dataset ") + row1.path, res.reason, res.stack);
            });
          }
        });
      }
    }
    return actions;
  }

  getTimestamp() {
    let dateTime = new Date();
    return moment(dateTime).format("YYYYMMDD");
  }

  dataHandler(data: any): TreeNode {
    const node: TreeNode = {};
    node.data = data;
    this.getMoreDatasetInfo(data);
    node.data.actions = this.getActions(data);

    node.children = [];

    if (data.children) {
      for (let i = 0; i < data.children.length; i++) {
        node.children.push(this.dataHandler(data.children[i]));
      }
    }
    delete node.data.children;
    return node;
  }

  getMoreDatasetInfo(dataObj) {
    const dataset_data2 = this.datasetData;
    for (const k in dataset_data2) {
      if (dataset_data2[k].id === dataObj.path) {
        if (dataset_data2[k].compression) {
          dataset_data2[k].compression.source !== "INHERITED"
            ? dataObj.compression = (dataset_data2[k].compression.parsed)
            : dataObj.compression = ("Inherits (" + dataset_data2[k].compression.parsed + ")");
        }
        if (dataset_data2[k].compressratio) {
          dataset_data2[k].compressratio.source !== "INHERITED"
            ? dataObj.compressratio = (dataset_data2[k].compressratio.parsed)
            : dataObj.compressratio = ("Inherits (" + dataset_data2[k].compressratio.parsed + ")");
        }
        if (dataset_data2[k].readonly) {
          dataset_data2[k].readonly.source !== "INHERITED"
            ? dataObj.readonly = (dataset_data2[k].readonly.parsed)
            : dataObj.readonly = ("Inherits (" + dataset_data2[k].readonly.parsed + ")");
        }
        if (dataset_data2[k].deduplication) {
          dataset_data2[k].deduplication.source !== "INHERITED"
            ? dataObj.dedup = (dataset_data2[k].deduplication.parsed)
            : dataObj.dedup = ("Inherits (" + dataset_data2[k].deduplication.parsed + ")");
        }
        if (dataset_data2[k].comments) {
          dataset_data2[k].comments.source !== "INHERITED"
            ? dataObj.comments = (dataset_data2[k].comments.parsed)
            : dataObj.comments = ("");
        }
      }
    }
  }

}


@Component({
  selector: 'app-volumes-list',
  styleUrls: ['./volumes-list.component.css'],
  templateUrl: './volumes-list.component.html'
})
export class VolumesListComponent extends EntityTableComponent implements OnInit, AfterViewInit {

  title = T("Pools");
  zfsPoolRows: ZfsPoolData[] = [];
  conf: InputTableConf = new VolumesListTableConfig(this, this.router, "", "Pools", {}, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate, this.snackBar);

  actionComponent = {
    getActions: (row) => {
      return this.conf.getActions(row);
    },
    conf: new VolumesListTableConfig(this, this.router, "", "Pools", {}, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate, this.snackBar)
  };

  actionEncryptedComponent = {
    getActions: (row) => {
      return (<VolumesListTableConfig>this.conf).getEncryptedActions(row);
    },
    conf: new VolumesListTableConfig(this, this.router, "", "Pools", {}, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate, this.snackBar)
  };

  expanded = false;
  public paintMe = true;


  constructor(protected core: CoreService ,protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService,
    protected mdDialog: MatDialog, protected erdService: ErdService, protected translate: TranslateService,
    public sorter: StorageService, protected snackBar: MatSnackBar) {
    super(core, rest, router, ws, _eRef, dialogService, loader, erdService, translate, snackBar, sorter);
  }

  public repaintMe() {
    this.showDefaults = false;
    this.paintMe = false;
    this.ngOnInit();
  }

  ngOnInit(): void {
    this.showSpinner = true;

    while (this.zfsPoolRows.length > 0) {
      this.zfsPoolRows.pop();
    }

    this.ws.call('pool.dataset.query', []).subscribe((datasetData) => {
      this.rest.get("storage/volume", {}).subscribe((res) => {
        res.data.forEach((volume: ZfsPoolData) => {
          volume.volumesListTableConfig = new VolumesListTableConfig(this, this.router, volume.id, volume.name, datasetData, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate, this.snackBar);
          volume.type = 'zpool';

          try {
            volume.availStr = (<any>window).filesize(volume.children[0].avail, { standard: "iec" });
          } catch (error) {
            volume.availStr = "" + volume.children[0].avail;
          }

          try {
            let used_pct =  volume.children[0].used / (volume.children[0].used + volume.children[0].avail);
            volume.usedStr = (<any>window).filesize(volume.children[0].used, { standard: "iec" }) + " (" + Math.round(used_pct * 100) / 100 + "%)";
          } catch (error) {
            volume.usedStr = "" + volume.children[0].used;
          }
          this.zfsPoolRows.push(volume);
        });

        this.zfsPoolRows = this.sorter.tableSorter(this.zfsPoolRows, 'name', 'asc');

        if (this.zfsPoolRows.length === 1) {
          this.expanded = true;
        }

        this.paintMe = true;

        this.showDefaults = true;
        this.showSpinner = false;

        
      }, (res) => {
        this.showDefaults = true;
        this.showSpinner = false;

        this.dialogService.errorReport(T("Error getting pool data."), res.message, res.stack);
      });
    }, (res) => {
      this.showDefaults = true;
      this.showSpinner = false;

      this.dialogService.errorReport(T("Error getting pool data."), res.message, res.stack);
    });

  }

  ngAfterViewInit(): void {

  }

}
