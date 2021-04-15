import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../../services';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-acmedns-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class AcmednsListComponent implements OnInit {
  title = 'ACME DNS Authenticators';
  protected queryCall = 'acme.dns.authenticator.query';
  protected wsDelete = 'acme.dns.authenticator.delete';
  protected route_add: string[] = ['system', 'acmedns', 'add'];
  protected route_success: string[] = ['system', 'acmedns'];
  protected entityList: any;

  constructor(protected router: Router,
    protected ws: WebSocketService) {
  }

  ngOnInit() {
  }

  columns: any[] = [
    { name: T('Authenticator'), prop: 'authenticator' },
    { name: T('Name'), prop: 'name', always_display: true },
  ];

  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'ACME DNS Authenticator',
      key_props: ['name'],
    },
  };

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(row) {
    return [{
      id: row.name,
      icon: 'edit',
      name: 'edit',
      label: T('Edit'),
      onClick: (row) => {
        this.router.navigate(
          new Array('').concat(['system', 'acmedns', 'edit', row.id]),
        );
      },
    },
    {
      id: row.name,
      icon: 'delete',
      name: 'delete',
      label: T('Delete'),
      onClick: (row) => {
        this.entityList.doDelete(row);
      },
    }];
  }
}
