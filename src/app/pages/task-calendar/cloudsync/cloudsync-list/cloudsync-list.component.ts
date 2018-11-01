import { WebSocketService, DialogService, JobService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import * as _ from 'lodash';
import { T } from '../../../../translate-marker';
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-cloudsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [JobService],
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
    { name: T('Description'), prop: 'description' },
    { name: T('Direction'), prop: 'direction'},
    { name: T('Path'), prop: 'path'},
    { name: T('Status'), prop: 'status', state: 'state'},
    { name: T('Minute'), prop: 'minute' },
    { name: T('Hour'), prop: 'hour' },
    { name: T('Day of Month'), prop: 'daymonth' },
    { name: T('Month'), prop: 'month' },
    { name: T('Day of Week'), prop: 'dayweek' },
    // { name: T('Auxiliary arguments'), prop: 'args' },
    { name: T('Credential'), prop: 'credential' },
    { name: T('Enabled'), prop: 'enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Cloud Sync Task',
      key_props: ['description']
    },
  };

  constructor(protected router: Router,
              protected ws: WebSocketService,
              protected translateService: TranslateService,
              protected dialog: DialogService,
              protected job: JobService) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(parentrow) {
    return [{
      id: "run",
      label: T("Run Now"),
      onClick: (row) => {
        this.dialog.confirm(T("Run Now"), T("Run this cloud sync now?"), true).subscribe((res) => {
          if (res) {
            row.state = 'RUNNING';
            this.ws.call('cloudsync.sync', [row.id]).subscribe(
              (res) => {
                this.translateService.get("close").subscribe((close) => {
                  this.entityList.snackBar.open(T('Cloud sync has started.'), close, { duration: 5000 });
                });
                this.job.getJobStatus(res).subscribe((task) => {
                  row.state = task.state;
                  row.job.id = task.id;
                  row.status = task.state;
                  if (task.error) {
                    row.status += ":" + task.error;
                  }
                  if (task.progress.description && task.state != 'SUCCESS') {
                    row.status += ':' + task.progress.description;
                  }
                });
              },
              (err) => {
                new EntityUtils().handleWSError(this.entityList, err);
              })
          }
        });
      },
    }, {
      id: "edit",
      label: T("Edit"),
      onClick: (row) => {
        this.route_edit.push(row.id);
        this.router.navigate(this.route_edit);
      },
    }, {
      id: "delete",
      label: T("Delete"),
      onClick: (row) => {
        this.entityList.doDelete(row);
      },
    }]
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      entityList.rows[i].minute = entityList.rows[i].schedule['minute'];
      entityList.rows[i].hour = entityList.rows[i].schedule['hour'];
      entityList.rows[i].daymonth = entityList.rows[i].schedule['dom'];
      entityList.rows[i].month = entityList.rows[i].schedule['month'];
      entityList.rows[i].dayweek = entityList.rows[i].schedule['dow'];
      entityList.rows[i].credential = entityList.rows[i].credentials['name'];
      if (entityList.rows[i].job == null) {
        entityList.rows[i].status = T("Not run since last boot");
      } else {
        entityList.rows[i].state = entityList.rows[i].job.state;
        entityList.rows[i].status = entityList.rows[i].job.state;
        if (entityList.rows[i].job.error) {
          entityList.rows[i].status += ":" + entityList.rows[i].job.error;
        }
        this.job.getJobStatus(entityList.rows[i].job.id).subscribe((task) => {
          entityList.rows[i].state = entityList.rows[i].job.state;
          entityList.rows[i].status = task.state;
          if (task.error) {
            entityList.rows[i].status += ":" + task.error;
          }
          if (task.progress.description && task.state != 'SUCCESS') {
            entityList.rows[i].status += ':' + task.progress.description;
          }
        });
      }
    }

  }

  stateButton(row) {
    this.job.showLogs(row.job.id);
  }
}
