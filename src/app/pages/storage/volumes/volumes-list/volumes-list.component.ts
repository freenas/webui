import { Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import filesize from 'filesize';
import { debug } from 'util';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';


export interface ZfsPoolData {
  avail: number;
  id: string;
  is_decrypted: boolean;
  is_upgraded: boolean;
  mountpoint: string;
  name: string;
  status: string;
  used: number;
  sed_pct: string;
  vol_encrypt: number;
  vol_encryptkey: string;
  vol_guid: string;
  vol_name: string;
  children: any[];
  volumesListTableConfig: VolumesListTableConfig;

}


export class VolumesListTableConfig {
  protected hideTopActions = true;
  protected flattenedVolData: any;
  protected resource_name = 'storage/volume';
  protected route_add: string[] = ['storage', 'volumes', 'manager'];
  protected route_add_tooltip = "Create ZFS Pool";
  public dataset_data: any;

  constructor(
    private _router: Router,
    private _classId: string,
    private title: string) {

    if (typeof (this._classId) !== "undefined" && this._classId !== "") {
      this.resource_name += "/" + this._classId;
    }
  }

  public columns: Array<any> = [
    { name: 'Name', prop: 'path', sortable: false },
    { name: 'Type', prop: 'type', sortable: false },
    { name: 'Used', prop: 'used', sortable: false },
    { name: 'Available', prop: 'avail', sortable: false },
    { name: 'Compression', prop: 'compression', sortable: false },
    { name: 'Readonly', prop: 'readonly', sortable: false },
    { name: 'Dedup', prop: 'dedup', sortable: false }

  ];

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };


  dataHandler(EntityTable: any) {
    for (let i = 0; i < EntityTable.rows.length; i++) {
      if (!EntityTable.rows[i].path) {
        EntityTable.rows[i].path = EntityTable.rows[i].name;
      }
    }
  }

  rowValue(row, attr) {
    switch (attr) {
      case 'avail':
        return filesize(row[attr], { standard: "iec" });
      case 'used':
        return filesize(row[attr], { standard: "iec" }) + " (" + row['used_pct'] +
          ")";
      default:
        return row[attr];
    }
  }

  public titleRowValue(row, attr): any {
    let returnValue = row[attr];

    switch (attr) {
      case 'avail':
      case 'used':
       try {
        returnValue = filesize(row[attr], { standard: "iec" });
       } catch(error) {
         console.log("Error", error);
       }
       break;
      default:
        returnValue = row[attr];
    }

    return returnValue;
  }

  getAddActions() {
    const actions = [];
    actions.push({
      label: "Import Volumes",
      icon: "vertical_align_bottom",
      onClick: () => {
        this._router.navigate(new Array('/').concat(
          ["storage", "volumes", "import_list"]));
      }
    });
    return actions;
  }

  getActions(row) {
    const actions = [];
    //workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (row.type === 'zpool') {
      actions.push({
        label: "Extend",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "volumes", "manager", row.id]));
        }
      });
      actions.push({
        label: "Delete",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "volumes", "delete", row.id]));
        }
      });
      actions.push({
        label: "Status",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "volumes", "status", row.id]));
        }
      });
    }
    if (row.type == "dataset") {
      actions.push({
        label: "Add Dataset",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "dataset",
            "add", row.path
          ]));
        }
      });
      actions.push({
        label: "Add Zvol",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol", "add",
            row.path
          ]));
        }
      });
      actions.push({
        label: "Edit Options",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "dataset",
            "edit", row.path
          ]));
        }
      });
      if (row.path.indexOf('/') != -1) {
        actions.push({
          label: "Delete Dataset",
          onClick: (row) => {
            this._router.navigate(new Array('/').concat([
              "storage", "volumes", "id", row.path.split('/')[0], "dataset",
              "delete", row.path
            ]));
          }
        });
        actions.push({
          label: "Edit Permissions",
          onClick: (row) => {
            this._router.navigate(new Array('/').concat([
              "storage", "volumes", "id", row.path.split('/')[0], "dataset",
              "permissions", row.path
            ]));
          }
        });
      }
    }
    if (row.type == "zvol") {
      actions.push({
        label: "Delete Zvol",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol",
            "delete", row.path
          ]));
        }
      });
      actions.push({
        label: "Edit Zvol",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol", "edit",
            row.path
          ]));
        }
      });
    }
    return actions;
  }


  resourceTransformIncomingRestData(data: any): any {
    data = new EntityUtils().flattenData(data);
    const returnData: any[] = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i].status !== '-') {
        data[i].type = 'zpool'
        data[i].path = data[i].name
      }
      if (data[i].type === 'dataset' && typeof (this.dataset_data) !== "undefined" && typeof (this.dataset_data.data) !== "undefined") {
        for (let k = 0; k < this.dataset_data.data.length; k++) {
          if (this.dataset_data.data[k].name === data[i].path) {
            data[i].compression = this.dataset_data.data[k].compression;
            data[i].readonly = this.dataset_data.data[k].readonly;
            data[i].dedup = this.dataset_data.data[k].dedup;
          }

        }
      }

      if( data[i].type !== 'zpool') {
        returnData.push(data[i]);
      }


    }

    return returnData;
  };
}


@Component({
  selector: 'app-volumes-list',
  templateUrl: './volumes-list.component.html'
})
export class VolumesListComponent extends EntityTableComponent implements OnInit, AfterViewInit {

  title = "Volumes";
  zfsPoolRows: ZfsPoolData[] = [];
  conf = new VolumesListTableConfig(this.router, "", "Volumes");
  expanded = false;

  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialog: DialogService, protected loader: AppLoaderService) {
    super(rest, router, ws, _eRef, dialog, loader);

  }

  ngOnInit(): void {
    this.rest.get("storage/volume", {}).subscribe((res) => {
      res.data.forEach((volume) => {
        volume.volumesListTableConfig = new VolumesListTableConfig(this.router, volume.id, volume.name);
        volume.type = 'zpool';
        this.zfsPoolRows.push(volume);
      });

      if( this.zfsPoolRows.length === 1 ) {
        this.expanded = true;
      }
    });

  }

  ngAfterViewInit(): void {

  }

}
