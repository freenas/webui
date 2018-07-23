import { WebSocketService, DialogService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
<<<<<<< HEAD
import { TaskService } from '../../../../services';
=======
import { T } from '../../../../translate-marker';
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../../../common/entity/utils';
>>>>>>> master

@Component({
  selector: 'app-cloudsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class CloudsyncListComponent {

  public title = "Cloud Sync Tasks";
  protected queryCall = 'cloudsync.query';
  protected route_add: string[] = ['tasks', 'cloudsync', 'add'];
  protected route_add_tooltip = "Add Cloud Sync Task";
  protected route_edit: string[] = ['tasks', 'cloudsync', 'edit'];
  protected wsDelete = "cloudsync.delete";
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Description', prop: 'description' },
    { name: 'Direction', prop: 'direction'},
    { name: 'Path', prop: 'path'},
    { name: 'Minute', prop: 'minute' },
    { name: 'Hour', prop: 'hour' },
    { name: 'Day of Month', prop: 'daymonth' },
    { name: 'Month', prop: 'month' },
    { name: 'Day of Week', prop: 'dayweek' },
    // { name: 'Auxiliary arguments', prop: 'args' },
    { name: 'Credential', prop: 'credential' },
    { name: 'Enabled', prop: 'enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true
  };

  constructor(protected router: Router,
              protected ws: WebSocketService,
              protected translateService: TranslateService,
              protected dialog: DialogService) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(parentrow) {
    return [{
      id: "run",
      label: T("Run Now"),
      onClick: (row) => {
        this.dialog.confirm(T("Run Now"), T(" Would you like to run this cloud sync task now?"), true).subscribe((res) => {
          if (res) {
            this.ws.call('cloudsync.sync', [parentrow.id]).subscribe(
              (res) => {
                this.translateService.get("close").subscribe((close) => {
                  this.entityList.snackBar.open(T('The cloud sync task has started.'), close, { duration: 5000 });
                })
              },
              (err) => {
                new EntityUtils().handleError(this, err);
              })
          }
        });
      },
    }, {
      id: "edit",
      label: T("Edit"),
      onClick: (row) => {
        this.route_edit.push(parentrow.id);
        this.router.navigate(this.route_edit);
      },
    }, {
      id: "delete",
      label: T("Delete"),
      onClick: (row) => {
        this.entityList.doDelete(parentrow.id);
      },
    }]
  }

  public multiActions: Array <any> = [];

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      entityList.rows[i].minute = entityList.rows[i].schedule['minute'];
      entityList.rows[i].hour = entityList.rows[i].schedule['hour'];
      entityList.rows[i].daymonth = entityList.rows[i].schedule['dom'];
      entityList.rows[i].month = entityList.rows[i].schedule['month'];
      entityList.rows[i].dayweek = entityList.rows[i].schedule['dow'];
      entityList.rows[i].credential = entityList.rows[i].credentials['name'];
    }

  }
}
