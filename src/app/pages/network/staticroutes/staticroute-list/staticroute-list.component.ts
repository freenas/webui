import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService } from '../../../../services/rest.service';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-staticroute-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class StaticRouteListComponent {
  title = 'Static Routes';
  protected queryCall = 'staticroute.query';
  protected route_add: string[] = ['network', 'staticroutes', 'add'];
  protected route_add_tooltip = 'Add Static Route';
  protected route_edit: string[] = ['network', 'staticroutes', 'edit'];
  protected wsDelete = 'staticroute.delete';

  columns: any[] = [
    { name: T('Destination'), prop: 'destination', always_display: true },
    { name: T('Gateway'), prop: 'gateway' },
    { name: T('Description'), prop: 'description' },
  ];
  rowIdentifier = 'destination';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Static Route',
      key_props: ['destination'],
    },
  };

  constructor(protected rest: RestService, protected router: Router) {}
}
