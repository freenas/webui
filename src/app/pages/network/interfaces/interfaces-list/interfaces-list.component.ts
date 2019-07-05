import {Component, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {interval} from 'rxjs';

import { WebSocketService, NetworkService, DialogService } from '../../../../services';
import { T } from '../../../../translate-marker';
import { MatSnackBar } from '@angular/material';
import helptext from '../../../../helptext/network/interfaces/interfaces-list';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector : 'app-interfaces-list',
  templateUrl : './interfaces-list.component.html',
  styleUrls : [ './interfaces-list.component.css' ],
})
export class InterfacesListComponent implements OnDestroy {

  public title = "Interfaces";
  //protected resource_name: string = 'network/interface/';
  protected queryCall = 'interface.query';
  protected wsDelete = 'interface.delete';
  protected route_add: string[] = [ 'network', 'interfaces', 'add' ];
  protected route_add_tooltip: string = "Add Interface";
  protected route_edit: string[] = [ 'network', 'interfaces', 'edit' ];
  protected confirmDeleteDialog = {
    message: T("Network connectivity will be interrupted. "),
  }
  protected hasDetails = true;
  protected entityList: any;
  protected checkChangesSubscription: any;
  public hasPendingChanges = false;
  public checkinWaiting = false;
  pending_changes_text: string;
  pending_checkin_text: string;
  checkin_text: string = T("Changes will revert after ");
  checkin_text_2: string = T(" seconds unless kept permanently.");
  public checkin_timeout = 60;
  public checkin_timeout_pattern = /\d+/;
  public checkin_remaining = null;
  checkin_interval;
  public ha_enabled = false;

  public columns: Array<any> = [
    {name : T('Name'), prop : 'name'},
    {name : T('Link State'), prop : 'link_state'},
    {name : T('DHCP'), prop : 'ipv4_dhcp'},
    {name : T('IPv6 Auto Configure'), prop: 'ipv6_auto'},
    {name : T('IP Addresses'), prop : 'addresses'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Interface',
      key_props: ['name']
    },
  };

  constructor(private ws: WebSocketService, private router: Router, private networkService: NetworkService,
              private snackBar: MatSnackBar, private dialog: DialogService) {}

  dataHandler(res) {
    const rows = res.rows;
    for (let i=0; i<rows.length; i++) {
      rows[i]['link_state'] = rows[i]['state']['link_state'].replace('LINK_STATE_', '');
      const addresses = [];
      for (let j=0; j<rows[i]['aliases'].length; j++) {
        const alias = rows[i]['aliases'][j];
        if (alias.type.startsWith('INET')) {
          addresses.push(alias.address + '/' + alias.netmask);
        }
      }
      if (rows[i].hasOwnProperty('failover_aliases')) {
        for (let j=0; j<rows[i]['failover_aliases'].length; j++) {
          const alias = rows[i]['failover_aliases'][j];
          if (alias.type.startsWith('INET')) {
            addresses.push(alias.address + '/' + alias.netmask);
          }
        }
      }
      rows[i]['addresses'] = addresses.join(', ');
      rows[i].details = []
      if (rows[i].type === "PHYSICAL") {
        rows[i].details.push({label: T("Active Media Type"), value:rows[i]["state"]["active_media_type"]},
                             {label: T("Active Media Subtype"), value:rows[i]["state"]["active_media_subtype"]})
      } else if (rows[i].type === "VLAN") {
        rows[i].details.push({label: T("VLAN Tag"), value:rows[i]["vlan_tag"]},
                             {label: T("VLAN Parent Interface"), value: rows[i]["state"]["vlan_parent_interface"]})
      } else if (rows[i].type === "BRIDGE") {
        rows[i].details.push({label:T("Bridge Members"), value:rows[i]["bridge_members"]});
      } else if (rows[i].type === "LINK_AGGREGATION") {
        rows[i].details.push({label:T("Lagg Ports"), value:rows[i]["lag_ports"]},
                             {label:T("Lagg Protocol"), value:rows[i]["lag_protocol"]});
      }
      rows[i].details.push({label:T("IP Addresses"), value:rows[i]['addresses']});
      rows[i].details.push({label:T("MAC Address"), value:rows[i]['state']['link_address']});
    }

  }

  getActions(row) {
    return [{
      id: "edit",
      label: T("Edit"),
      onClick: (rowinner) => { 
        if(this.ha_enabled) {
          this.dialog.Info(helptext.ha_enabled_edit_title, helptext.ha_enabled_delete_msg);
        } else {
          this.entityList.doEdit(rowinner.id);
        }
      },
    }, {
      id: "delete",
      label: T("Delete"),
      onClick: (rowinner) => {
        if(this.ha_enabled) {
          this.dialog.Info(helptext.ha_enabled_delete_title, helptext.ha_enabled_delete_msg);
        } else {
          this.entityList.doDelete(rowinner);
        }
      },
    }]
  }

  preInit(entityList) {
    this.pending_changes_text = helptext.pending_changes_text;
    this.pending_checkin_text = helptext.pending_checkin_text + " " + helptext.pending_checkin_text_2;
    this.entityList = entityList;

    this.checkPendingChanges();
    this.checkChangesSubscription = interval(10000).subscribe(x => {
      this.checkPendingChanges();
      this.checkWaitingCheckin();
    });

    if (window.localStorage.getItem('is_freenas') === 'false') {
      this.ws.call('failover.licensed').subscribe((is_ha) => {
        if (is_ha) {
          this.ws.call('failover.disabled_reasons').subscribe((failover_disabled) => {
            if (failover_disabled.length === 0) {
              this.ha_enabled = true;
            }
          });
        }
      });
    }
  }

  checkPendingChanges() {
    this.ws.call('interface.has_pending_changes').subscribe(res => {
      this.hasPendingChanges = res;
    });
  }

  checkWaitingCheckin() {
    this.ws.call('interface.checkin_waiting').subscribe(res => {
      if (res != null) {
        const seconds = res.toFixed(0);
        if (seconds > 0 && this.checkin_remaining == null) {
          this.checkin_remaining = seconds;
          this.checkin_interval = setInterval(() => {
            if (this.checkin_remaining > 0) {
              this.checkin_remaining -= 1;
            } else {
              this.checkin_remaining = null;
              this.checkinWaiting = false;
              clearInterval(this.checkin_interval);
            }
          }, 1000);
        }
        this.checkinWaiting = true;
      } else {
        this.checkinWaiting = false;
        this.checkin_remaining = null;
        if (this.checkin_interval) {
          clearInterval(this.checkin_interval);
        }
      }
    });
  }

  commitPendingChanges() {
    this.entityList.dialogService.confirm(
      helptext.commit_changes_title,
      helptext.commit_changes_warning,
      false, helptext.commit_button).subscribe(confirm => {
        if (confirm) {
          this.entityList.loader.open();
          this.entityList.loaderOpen = true;
          this.ws.call('interface.commit', [{checkin_timeout: this.checkin_timeout}]).subscribe(res => {
            this.entityList.loader.close();
            this.entityList.loaderOpen = false;
            this.hasPendingChanges = false;
            this.snackBar.open(helptext.changes_saved_successfully, T("Ok"));
          }, err => {
            this.entityList.loader.close();
            this.entityList.loaderOpen = false;
            new EntityUtils().handleWSError(this.entityList, err);
          });
        }
      });
  }

  checkInNow() {
    this.entityList.dialogService.confirm(
      helptext.checkin_title,
      helptext.checkin_message,
      true, helptext.checkin_button).subscribe(res => {
        if (res) {
          this.entityList.loader.open();
          this.entityList.loaderOpen = true;
          this.ws.call('interface.checkin').subscribe((success) => {
            this.entityList.loader.close();
            this.entityList.dialogService.Info(
              helptext.checkin_complete_title,
              helptext.checkin_complete_message);
            this.hasPendingChanges = false;
            this.checkinWaiting = false;
            clearInterval(this.checkin_interval);
            this.checkin_remaining = null;
          }, (err) => {
            this.entityList.loader.close();
            new EntityUtils().handleWSError(this.entityList, err);
          });
        }
      }
    );
  }

  rollbackPendingChanges() {
    this.entityList.dialogService.confirm(
      helptext.rollback_changes_title,
      helptext.rollback_changes_warning,
      false, helptext.rollback_button).subscribe(confirm => {
        if (confirm) {
          this.entityList.loader.open();
          this.entityList.loaderOpen = true;
          this.ws.call('interface.rollback').subscribe(res => {
            this.entityList.loader.close();
            this.entityList.loaderOpen = false;
            this.hasPendingChanges = false;
            this.checkinWaiting = false;
            this.snackBar.open(helptext.changes_rolled_back, T("Ok"));
          }, err => {
            this.entityList.loader.close();
            this.entityList.loaderOpen = false;
            new EntityUtils().handleWSError(this.entityList, err);
          });
        }
      });
  }

  /*doAdd() {
    this.networkService.getInterfaceNicChoices().subscribe(
      (res)=>{
        if (res.length == 0) {
          this.snackBar.open("All interfaces are already in use.", 'close', { duration: 5000 });
        } else {
          this.router.navigate(new Array('/').concat(this.route_add));
        }
      }
    )
  }*/

  ngOnDestroy() {
    this.checkChangesSubscription.unsubscribe();
  }
}
