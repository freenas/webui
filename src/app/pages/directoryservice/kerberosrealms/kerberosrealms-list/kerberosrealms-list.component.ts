import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-user-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class KerberosRealmsListComponent {

  public title = "Kerberos Realms";
  protected resource_name: string = 'directoryservice/kerberosrealm';
  protected route_add: string[] = ['directoryservice', 'kerberosrealms', 'add'];
  protected route_add_tooltip: string = "Add Kerberos Realm";
  protected route_edit: string[] = ['directoryservice', 'kerberosrealms', 'edit'];

  public columns: Array < any > = [
    { name: T('Realm'), prop: 'krb_realm' },
    { name: T('KDC'), prop: 'krb_kdc' },
    { name: T('Admin Server'), prop: 'krb_admin_server' },
    { name: T('Password Server'), prop: 'krb_kpasswd_server' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Kerberos Realm',
      key_props: ['krb_realm']
    },
  };

  constructor(protected rest: RestService, private router: Router){}
}
