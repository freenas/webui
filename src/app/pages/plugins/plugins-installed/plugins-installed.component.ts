import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../../app/services';
import { EntityUtils } from '../../common/entity/utils';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-plugins-installed-list',
  // template: `<entity-table [title]="title" [conf]="this"></entity-table>`
  templateUrl: './plugins-installed.component.html',
  styleUrls: ['../plugins-available/plugins-available-list.component.css'],
  providers: [ DialogService ]
})
export class PluginsInstalledListComponent {

  public title = "Installed Plugins";
  protected queryCall = 'jail.list_resource';
  protected queryCallOption = ["PLUGIN"];
  protected wsDelete = 'jail.do_delete';
  protected wsMultiDelete = 'core.bulk';
  protected entityList: any;
  public toActivatePool: boolean = false;
  public legacyWarning = T("Note: Legacy plugins created before FreeNAS 11.2 must be managed from the");
  public legacyWarningLink = T("legacy web interface");

  public columns: Array < any > = [
    { name: T('Jail'), prop: '1' },
    { name: T('Status'), prop: '3' },
    { name: T('IPv4 Address'), prop: '6' },
    { name: T('IPv6 Address'), prop: '7' },
    { name: T('Version'), prop: '10' },
    // { name: T('Boot'), prop: '2' },
    // { name: 'Type', prop: '4' },
    { name: T('Release'), prop: '5' },
    // { name: T('Template'), prop: '8' }
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Plugin',
      key_props: ['1'],
      id_prop: '1',
    },
  };
  public multiActions: Array < any > = [{
      id: "mstart",
      label: T("Start"),
      icon: "play_arrow",
      enable: true,
      ttpos: "above", // tooltip position
      onClick: (selected) => {
        let selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.start", selectedJails]).subscribe(
            (res) => {
              for (let i in selected) {
                selected[i][3] = 'up';
                this.updateRow(selected[i]);
              }
              this.updateMultiAction(selected);
              this.loader.close();
            },
            (res) => {
              new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              this.loader.close();
            });
            
      }
    },
    {
      id: "mstop",
      label: T("Stop"),
      icon: "stop",
      enable: true,
      ttpos: "above",
      onClick: (selected) => {
        let selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.stop", selectedJails]).subscribe(
            (res) => {
              for (let i in selected) {
                selected[i][3] = 'down';
                this.updateRow(selected[i]);
              }
              this.updateMultiAction(selected);
              this.loader.close();
            },
            (res) => {
              new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              this.loader.close();
            });
      }
    },
    {
      id: "mdelete",
      label: T("Delete"),
      icon: "delete",
      enable: true,
      ttpos: "above",
      onClick: (selected) => {
        this.entityList.doMultiDelete(selected);
      }
    },
  ];

  public isPoolActivated: boolean;
  public selectedPool;
  public activatedPool: any;
  public availablePools: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected loader: AppLoaderService,
              protected dialogService: DialogService) {
    this.getActivatedPool();
    this.getAvailablePools();
  }

  getActivatedPool(){
    this.ws.call('jail.get_activated_pool').subscribe((res)=>{
      if (res != null) {
        this.activatedPool = res;
        this.selectedPool = res;
        this.isPoolActivated = true;
      } else {
        this.isPoolActivated = false;
      }
    })
  }

  getAvailablePools(){
    this.ws.call('pool.query').subscribe( (res)=> {
      this.availablePools = res;
    })
  }

  activatePool(event: Event){
    this.loader.open();
    this.ws.call('jail.activate', [this.selectedPool]).subscribe(
      (res)=>{
        this.loader.close();
        this.isPoolActivated = true;
        this.activatedPool = this.selectedPool;
        if (this.toActivatePool) {
          this.entityList.getData();
        }
        this.entityList.snackBar.open("Successfully activate pool " + this.selectedPool , 'close', { duration: 5000 });
      },
      (res) => {
        new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
      });
  }

  afterInit(entityList: any) { this.entityList = entityList; }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'start' && row[3] === "up") {
      return false;
    } else if (actionId === 'stop' && row[3] === "down") {
      return false;
    } else if (actionId === 'management' && (row[3] === "down" || row[9] == null)) {
      return false;
    } else if (actionId === 'restart' && row[3] === "down") {
      return false;
    }
    return true;
  }

  updateRow(row) {
    this.ws.call('jail.list_resource', ["PLUGIN"]).subscribe(
      (res) => {
        for(let i = 0; i < res.length; i++) {
          if (res[i][1] == row[1]) {
            for (let j = 0; j < row.length; j++) {
              if (j == 6) {
                if (_.split(res[i][j], '|').length > 1) {
                  row[j] = _.split(res[i][j], '|')[1];
                } else {
                  row[j] = res[i][j];
                }
              } else {
                row[j] = res[i][j];
              }
            }
            break;
          }
        }
      }
    )
  }

  getActions(parentRow) {
    return [{
        id: "start",
        label: T("Start"),
        onClick: (row) => {
          this.loader.open();
          this.entityList.busy =
            this.ws.call('jail.start', [row[1]]).subscribe(
              (res) => {
                this.loader.close();
                this.updateRow(row);
              },
              (res) => {
                this.loader.close();
                new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              });
        }
      },
      {
        id: "restart",
        label: T("Restart"),
        onClick: (row) => {
          this.loader.open();
          row[3] = 'restarting';
          this.entityList.busy =
            this.ws.call('jail.stop', [row[1]]).subscribe(
              (res) => {
                this.ws.call('jail.start', [row[1]]).subscribe(
                  (res) => {
                    this.loader.close();
                    this.updateRow(row);
                  },
                  (res) => {
                    this.loader.close();
                    new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
                  });
              },
              (res) => {
                this.loader.close();
                new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              });
        }
      },
      {
        id: "stop",
        label: T("Stop"),
        onClick: (row) => {
          this.loader.open();
          this.entityList.busy =
            this.ws.call('jail.stop', [row[1]]).subscribe(
              (res) => {
                this.loader.close();
                this.updateRow(row);
              },
              (res) => {
                this.loader.close();
                new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              });
        }
      },
      {
        id: "management",
        label: T("Management"),
        onClick: (row) => {
          window.open(row[9]);
        }
      },
      {
        id: "delete",
        label: T("Delete"),
        onClick: (row) => {
          this.entityList.doDelete(row);
        }
      }
    ]
  }

  getSelectedNames(selectedJails) {
    let selected: any = [];
    for (let i in selectedJails) {
      selected.push([selectedJails[i][1]]);
    }
    return selected;
  }

  updateMultiAction(selected: any) {
    if (_.find(selected, function(plugin) { return plugin[3] == 'up'; })) {
     _.find(this.multiActions, {'id': 'mstop'})['enable'] = true;
    } else {
      _.find(this.multiActions, {'id': 'mstop'})['enable'] = false;
    }

    if (_.find(selected, function(plugin) { return plugin[3] == 'down'; })) {
     _.find(this.multiActions, {'id': 'mstart'})['enable'] = true;
    } else {
      _.find(this.multiActions, {'id': 'mstart'})['enable'] = false;
    }
  }

  wsMultiDeleteParams(selected: any) {
    let params: Array<any> = ['jail.do_delete'];
    params.push(this.getSelectedNames(selected));
    return params;
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      if (_.split(entityList.rows[i][6], '|').length > 1) {
        entityList.rows[i][6] = _.split(entityList.rows[i][6], '|')[1];
      }
    }
  }
}
