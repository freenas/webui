import { WebSocketService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';

@Component({
  selector: 'app-cloudsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
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
    { name: 'Auxiliary arguments', prop: 'args' },
    { name: 'Credential', prop: 'credential' },
    { name: 'Enabled', prop: 'enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router, protected ws: WebSocketService, protected taskService: TaskService) {
  }
  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(parentRow) {
    return [{
        id: "edit",
        label: "Edit",
        onClick: (row) => {
          this.router.navigate(
            new Array('').concat(["tasks", "cloudsync", "edit", row.id]));
        }
      },
      {
        id: "delete",
        label: "Delete",
        onClick: (row) => {
          this.entityList.doDelete(row.id);
        }
      },
      {
        id: "start",
        label: "Run Now",
        onClick: (row) => {
          this.entityList.busy =
            this.ws.call('cloudsync.sync', [row.id]).subscribe(
              (res) => {

              },
              (res) => {
                // new EntityUtils().handleError(this, res);
              });
        }
      }
    ]
  }

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
