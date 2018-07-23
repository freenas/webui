import { RestService, DialogService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
<<<<<<< HEAD
import { TaskService } from '../../../../services';
=======
import { TaskService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';
>>>>>>> master

@Component({
  selector: 'app-rsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class RsyncListComponent {

  public title = "Rsync Tasks";
  protected resource_name = 'tasks/rsync';
  protected route_add: string[] = ['tasks', 'rsync', 'add'];
  protected route_add_tooltip = "Add Rsync Task";
  protected route_edit: string[] = ['tasks', 'rsync', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Path', prop: 'rsync_path' },
    { name: 'Remote Host', prop: 'rsync_remotehost' },
    { name: 'Remote Module Name', prop: 'rsync_remotemodule' },
    { name: 'User', prop: 'rsync_user' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true
  };

<<<<<<< HEAD
  public multiActions: Array <any> = [];

  constructor(protected router: Router, protected rest: RestService, protected taskService: TaskService) {}
=======
  constructor(protected router: Router, protected rest: RestService, protected taskService: TaskService,
              protected dialog: DialogService, protected translate: TranslateService) {}
>>>>>>> master

  afterInit(entityList: any) { this.entityList = entityList; }

  getActions(row) {
    const actions = [];
    actions.push({
      label : T("Run Now"),
      id: "run",
      onClick : (members) => {
        this.dialog.confirm(T("Run Now"), T(" Would you like to run this rsync task now?"), true).subscribe((run) => {
          if (run) {
            this.rest.post(this.resource_name + '/' + row.id + '/run/', {} ).subscribe((res) => {
              this.translate.get("close").subscribe((close) => {
                this.entityList.snackBar.open(res.data, close, { duration: 5000 });
              });
            }, (err) => {
              new EntityUtils().handleError(this, err);
            });
          }
        });
      }
    });
    actions.push({
      label : T("Edit"),
      id: "edit",
      onClick : (task_edit) => {
        this.router.navigate(new Array('/').concat(
          [ 'tasks', 'rsync', 'edit', row.id ]));
      }
    })
    actions.push({
      label : T("Delete"),
      onClick : (task_delete) => {
        this.entityList.doDelete(row.id );
      },
    });

    return actions;
  }
}
