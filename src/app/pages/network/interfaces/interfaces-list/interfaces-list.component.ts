import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {RestService, NetworkService} from '../../../../services';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-interfaces-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class InterfacesListComponent {

  public title = "Interfaces";
  protected resource_name: string = 'network/interface/';
  protected route_add: string[] = [ 'network', 'interfaces', 'add' ];
  protected route_add_tooltip: string = "Add Interface";
  protected add_disabled: boolean;
  protected route_edit: string[] = [ 'network', 'interfaces', 'edit' ];
  protected confirmDeleteDialog = {
    message: T("Network connectivity will be interrupted. Delete the selected interface?"),
  }

  public columns: Array<any> = [
    {name : T('Interface'), prop : 'int_interface'},
    {name : T('Name'), prop : 'int_name'},
    {name : T('Media Status'), prop : 'int_media_status'},
    {name : T('DHCP'), prop : 'int_dhcp'},
    {name : T('IPv6 Auto Configure'), prop: 'int_ipv6auto'},
    {name : T('IPv4 Addresses'), prop : 'ipv4_addresses'},
    {name : T('IPv6 Addresses'), prop : 'ipv6_addresses'},
    {name : T('Options'), prop: 'int_options'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  constructor(_rest: RestService, _router: Router, protected networkService: NetworkService) {
    this.networkService.getInterfaceNicChoices().subscribe(
      (res)=>{
        if (res.length == 0) {
          this.add_disabled = true;
        } else {
          this.add_disabled = false;
        }
      }
    )
  }

  rowValue(row, attr) {
    if (attr == 'ipv4_addresses' || attr == 'ipv6_addresses') {
      return row[attr].join(', ');
    }
    return row[attr];
  }
}
