import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Navigation, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as ipRegex from 'ip-regex';
import { Subject } from 'rxjs';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import helptext from 'app/helptext/network/interfaces/interfaces-list';
import { CoreEvent } from 'app/interfaces/events';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { Service } from 'app/interfaces/service.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { AppTableAction } from 'app/pages/common/entity/table/table.component';
import {
  AppLoaderService,
  DialogService,
  NetworkService,
  ServicesService,
  StorageService,
  WebSocketService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { EntityUtils } from '../common/entity/utils';
import { CardWidgetConf } from './card-widget/card-widget.component';
import { ConfigurationComponent } from './forms/configuration.component';
import { InterfacesFormComponent } from './forms/interfaces-form.component';
import { IPMIFromComponent } from './forms/ipmi-form.component';
import { OpenvpnClientComponent } from './forms/service-openvpn-client.component';
import { OpenvpnServerComponent } from './forms/service-openvpn-server.component';
import { StaticRouteFormComponent } from './forms/staticroute-form.component';

@UntilDestroy()
@Component({
  selector: 'app-interfaces-list',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
})
export class NetworkComponent extends ViewControllerComponent implements OnInit, OnDestroy {
  protected summayCall: 'network.general.summary' = 'network.general.summary';
  protected configCall: 'network.configuration.config' = 'network.configuration.config';
  formEvent$: Subject<CoreEvent>;

  ha_enabled = false;
  hasPendingChanges = false;
  checkinWaiting = false;
  checkin_timeout = 60;
  checkin_timeout_pattern = /\d+/;
  checkin_remaining: number = null;
  private uniqueIPs: string[] = [];
  private affectedServices: string[] = [];
  checkin_interval: Interval;

  private navigation: Navigation;
  helptext = helptext;

  interfaceTableConf = {
    title: T('Interfaces'),
    queryCall: 'interface.query',
    deleteCall: 'interface.delete',
    name: 'interfaces',
    columns: [
      { name: T('Name'), prop: 'name', state: { prop: 'link_state' } },
      { name: T('IP Addresses'), prop: 'addresses', listview: true },
    ],
    dataSourceHelper: this.interfaceDataSourceHelper,
    getInOutInfo: this.getInterfaceInOutInfo.bind(this),
    parent: this,
    tableComponent: undefined as any,
    add() {
      this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent);
    },
    edit(row: any) {
      this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent, row.id);
    },
    delete(row: any, table: any) {
      const deleteAction = row.type === NetworkInterfaceType.Physical ? T('Reset configuration for ') : T('Delete ');
      if (this.parent.ha_enabled) {
        this.parent.dialog.Info(helptext.ha_enabled_edit_title, helptext.ha_enabled_edit_msg);
      } else {
        table.tableService.delete(table, row, deleteAction);
      }
    },
    afterGetData() {
      const state = this.parent.navigation.extras.state as { editInterface: string };
      if (state && state.editInterface) {
        this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent, state.editInterface);
      }
    },
    afterDelete: this.afterDelete.bind(this),
    deleteMsg: {
      title: 'interfaces',
      key_props: ['name'],
    },
    confirmDeleteDialog: {
      buildTitle: (intf: any) => {
        if (intf.type === NetworkInterfaceType.Physical) {
          return T('Reset Configuration');
        }
        return T('Delete');
      },
      buttonMsg: (intf: any) => {
        if (intf.type === NetworkInterfaceType.Physical) {
          return T('Reset Configuration');
        }
        return T('Delete');
      },
      message: helptext.delete_dialog_text,
    },
  };

  staticRoutesTableConf = {
    title: T('Static Routes'),
    queryCall: 'staticroute.query',
    deleteCall: 'staticroute.delete',
    name: 'staticRoutes',
    columns: [
      { name: T('Destination'), prop: 'destination', always_display: true },
      { name: T('Gateway'), prop: 'gateway' },
    ],
    parent: this,
    tableComponent: undefined as any,
    add() {
      this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent);
    },
    edit(row: any) {
      this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent, row.id);
    },
    deleteMsg: {
      title: 'static route',
      key_props: ['destination', 'gateway'],
    },
  };

  globalSettingsWidget: CardWidgetConf = {
    title: T('Global Configuration'),
    data: {},
    parent: this,
    icon: 'router',
    showGroupTitle: true,
    name: 'globalSettings',
    onclick() {
      this.parent.modalService.open('slide-in-form', this.parent.addComponent);
    },
  };

  openvpnTableConf = {
    title: T('OpenVPN'),
    queryCall: 'service.query',
    name: 'openVPN',
    columns: [
      { name: T('Service'), prop: 'service_label' },
      { name: T('State'), prop: 'state' },
    ],
    hideHeader: true,
    parent: this,
    dataSourceHelper: this.openvpnDataSourceHelper,
    getActions: this.getOpenVpnActions.bind(this),
    isActionVisible: this.isOpenVpnActionVisible,
    edit(row: Service) {
      if (row.service === ServiceName.OpenVpnClient) {
        this.parent.modalService.open('slide-in-form', this.parent.openvpnClientComponent, row.id);
      } else if (row.service === ServiceName.OpenVpnServer) {
        this.parent.modalService.open('slide-in-form', this.parent.openvpnServerComponent, row.id);
      }
    },
    afterGetData() {
      const state = this.parent.navigation.extras.state as { configureOpenVPN: string };
      if (state && state.configureOpenVPN) {
        state.configureOpenVPN === 'client'
          ? this.parent.modalService.open('slide-in-form', this.parent.openvpnClientComponent)
          : this.parent.modalService.open('slide-in-form', this.parent.openvpnServerComponent);
      }
    },
  };

  ipmiTableConf = {
    title: 'IPMI',
    queryCall: 'ipmi.query',
    columns: [
      { name: T('Channel'), prop: 'channel_lable' },
    ],
    hideHeader: true,
    parent: this,
    dataSourceHelper: this.ipmiDataSourceHelper,
    getActions: this.getIpmiActions.bind(this),
    isActionVisible: this.isIpmiActionVisible,
    edit(row: any) {
      this.parent.modalService.open('slide-in-form', this.parent.impiFormComponent, row.id);
    },
  };

  networkSummary: NetworkSummary;
  impiEnabled: boolean;

  protected addComponent: ConfigurationComponent;
  protected interfaceComponent: InterfacesFormComponent;
  protected staticRouteFormComponent: StaticRouteFormComponent;
  protected openvpnClientComponent: OpenvpnClientComponent;
  protected openvpnServerComponent: OpenvpnServerComponent;
  protected impiFormComponent: IPMIFromComponent;

  hasConsoleFooter = false;
  constructor(
    private ws: WebSocketService,
    private router: Router,
    private aroute: ActivatedRoute,
    private networkService: NetworkService,
    private dialog: DialogService,
    private storageService: StorageService,
    private loader: AppLoaderService,
    private modalService: ModalService,
    private servicesService: ServicesService,
    private translate: TranslateService,
  ) {
    super();
    this.getGlobalSettings();
    this.navigation = this.router.getCurrentNavigation();
  }

  getGlobalSettings(): void {
    this.ws.call(this.configCall).pipe(untilDestroyed(this)).subscribe(
      (networkConfig) => {
        this.ws.call(this.summayCall).pipe(untilDestroyed(this)).subscribe(
          (summary) => {
            this.networkSummary = summary;
            this.globalSettingsWidget.data.nameserver = summary.nameservers.map((item) => {
              switch (item) {
                case networkConfig.nameserver1:
                  return { label: 'Nameserver 1', value: item };
                case networkConfig.nameserver2:
                  return { label: 'Nameserver 2', value: item };
                case networkConfig.nameserver3:
                  return { label: 'Nameserver 3', value: item };
                default:
                  return { label: 'Nameserver (DHCP)', value: item };
              }
            });
            this.globalSettingsWidget.data.ipv4 = summary.default_routes.filter((item) => ipRegex.v4().test(item));
            this.globalSettingsWidget.data.ipv6 = summary.default_routes.filter((item) => ipRegex.v6().test(item));

            this.globalSettingsWidget.data.hostname = networkConfig.hostname;
            this.globalSettingsWidget.data.domain = networkConfig.domain;
            this.globalSettingsWidget.data.netwait = networkConfig.netwait_enabled ? T('ENABLED') : T('DISABLED');
            const tempArr: string[] = [];
            if (networkConfig.service_announcement.netbios) {
              tempArr.push(T('NETBIOS-NS'));
            }
            if (networkConfig.service_announcement.mdns) {
              tempArr.push(T('mDNS'));
            }
            if (networkConfig.service_announcement.wsd) {
              tempArr.push(T('WS-DISCOVERY'));
            }
            this.globalSettingsWidget.data.service_announcement = tempArr.join(', ');
            this.globalSettingsWidget.data.additional_domains = networkConfig.domains.length > 0
              ? networkConfig.domains.join(', ') : '---';
            this.globalSettingsWidget.data.httpproxy = networkConfig.httpproxy !== '' ? networkConfig.httpproxy : '---';
            this.globalSettingsWidget.data.hostnameDB = networkConfig.hosts !== '' ? networkConfig.hosts : '---';

            if (networkConfig.activity.type === NetworkActivityType.Deny) {
              this.globalSettingsWidget.data.outbound = T('Allow All');
            } else if (networkConfig.activity.activities.length === 0) {
              this.globalSettingsWidget.data.outbound = T('Deny All');
            } else {
              this.globalSettingsWidget.data.outbound = T('Allow ') + networkConfig.activity.activities.join(', ');
            }
          },
        );
      },
    );

    this.ws.call('ipmi.is_loaded').pipe(untilDestroyed(this)).subscribe((isIpmiLoaded) => {
      this.impiEnabled = isIpmiLoaded;
    });
  }

  ngOnInit(): void {
    this.refreshNetworkForms();
    this.modalService.refreshForm$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshNetworkForms();
    });

    this.ws.call('system.advanced.config').pipe(untilDestroyed(this)).subscribe((advancedConfig) => {
      this.hasConsoleFooter = advancedConfig.consolemsg;
    });

    this.checkInterfacePendingChanges();
    this.core.register({ observerClass: this, eventName: 'NetworkInterfacesChanged' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt && evt.data.checkin) {
        this.checkin_remaining = null;
        this.checkinWaiting = false;
        if (this.checkin_interval) {
          clearInterval(this.checkin_interval);
        }
        this.hasPendingChanges = false;
      }
    });

    if (window.localStorage.getItem('product_type') === ProductType.Enterprise) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((is_ha) => {
        if (is_ha) {
          this.ws.call('failover.disabled_reasons').pipe(untilDestroyed(this)).subscribe((failover_disabled) => {
            if (failover_disabled.length === 0) {
              this.ha_enabled = true;
            }
          });
        }
      });
    }
  }

  checkInterfacePendingChanges(): void {
    if (this.interfaceTableConf.tableComponent) {
      this.interfaceTableConf.tableComponent.getData();
    }
    this.checkPendingChanges();
    this.checkWaitingCheckin();
  }

  checkPendingChanges(): void {
    this.ws.call('interface.has_pending_changes').pipe(untilDestroyed(this)).subscribe((hasPendingChanges) => {
      this.hasPendingChanges = hasPendingChanges;
    });
  }

  checkWaitingCheckin(): void {
    this.ws.call('interface.checkin_waiting').pipe(untilDestroyed(this)).subscribe((res) => {
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
              window.location.reload(); // should just refresh after the timer goes off
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

  commitPendingChanges(): void {
    this.ws.call('interface.services_restarted_on_sync').pipe(untilDestroyed(this)).subscribe((res: any[]) => {
      if (res.length > 0) {
        const ips: string[] = [];
        res.forEach((item) => {
          if (item['system-service']) {
            this.affectedServices.push(item['system-service']);
          }
          if (item['service']) {
            this.affectedServices.push(item['service']);
          }
          item.ips.forEach((ip: any) => {
            ips.push(ip);
          });
        });

        ips.forEach((ip) => {
          if (!this.uniqueIPs.includes(ip)) {
            this.uniqueIPs.push(ip);
          }
        });
      }
      this.dialog.confirm(
        helptext.commit_changes_title,
        helptext.commit_changes_warning,
        false, helptext.commit_button,
      ).pipe(untilDestroyed(this)).subscribe((confirm: boolean) => {
        if (confirm) {
          this.loader.open();
          this.ws.call('interface.commit', [{ checkin_timeout: this.checkin_timeout }]).pipe(untilDestroyed(this)).subscribe(() => {
            this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: true, checkin: false }, sender: this });
            this.interfaceTableConf.tableComponent.getData();
            this.loader.close();
            this.checkWaitingCheckin();
          }, (err) => {
            this.loader.close();
            new EntityUtils().handleWSError(this, err, this.dialog);
          });
        }
      });
    });
  }

  checkInNow(): void {
    if (this.affectedServices.length > 0) {
      this.translate.get(helptext.services_restarted.message_a).pipe(untilDestroyed(this)).subscribe((msgA) => {
        this.translate.get(helptext.services_restarted.message_b).pipe(untilDestroyed(this)).subscribe((msgB) => {
          this.dialog.confirm(helptext.services_restarted.title, msgA + ' '
          + this.uniqueIPs.join(', ') + ' ' + msgB + ' ' + this.affectedServices.join(', '),
          true, helptext.services_restarted.button).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
            if (res) {
              this.finishCheckin();
            }
          });
        });
      });
    } else {
      this.dialog.confirm(
        helptext.checkin_title,
        helptext.checkin_message,
        true, helptext.checkin_button,
      ).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
        if (res) {
          this.finishCheckin();
        }
      });
    }
  }

  finishCheckin(): void {
    this.loader.open();
    this.ws.call('interface.checkin').pipe(untilDestroyed(this)).subscribe(() => {
      this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: true, checkin: true }, sender: this });
      this.loader.close();
      this.dialog.Info(
        helptext.checkin_complete_title,
        helptext.checkin_complete_message,
        '500px',
        'info',
      );
      this.hasPendingChanges = false;
      this.checkinWaiting = false;
      clearInterval(this.checkin_interval);
      this.checkin_remaining = null;
    }, (err) => {
      this.loader.close();
      new EntityUtils().handleWSError(this, err, this.dialog);
    });
  }

  rollbackPendingChanges(): void {
    this.dialog.confirm(
      helptext.rollback_changes_title,
      helptext.rollback_changes_warning,
      false, helptext.rollback_button,
    ).pipe(untilDestroyed(this)).subscribe((confirm: boolean) => {
      if (confirm) {
        this.loader.open();
        this.ws.call('interface.rollback').pipe(untilDestroyed(this)).subscribe(() => {
          this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false }, sender: this });
          this.interfaceTableConf.tableComponent.getData();
          this.hasPendingChanges = false;
          this.checkinWaiting = false;
          this.loader.close();
          this.dialog.Info(helptext.rollback_changes_title, helptext.changes_rolled_back, '500px', 'info', true);
        }, (err) => {
          this.loader.close();
          new EntityUtils().handleWSError(this, err, this.dialog);
        });
      }
    });
  }

  afterDelete(): void {
    this.hasPendingChanges = true;
    this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false, checkin: false }, sender: this });
  }

  goToHA(): void {
    this.router.navigate(new Array('/').concat('system', 'failover'));
  }

  refreshNetworkForms(): void {
    this.addComponent = new ConfigurationComponent(this.router, this.ws);
    this.addComponent.afterModalFormClosed = this.getGlobalSettings.bind(this); // update global config card
    this.interfaceComponent = new InterfacesFormComponent(
      this.router,
      this.aroute,
      this.networkService,
      this.dialog,
      this.ws,
    );
    this.interfaceComponent.afterModalFormClosed = this.checkInterfacePendingChanges.bind(this);
    this.staticRouteFormComponent = new StaticRouteFormComponent(this.aroute, this.ws, this.networkService);
    if (this.staticRoutesTableConf.tableComponent) {
      this.staticRouteFormComponent.afterModalFormClosed = this.staticRoutesTableConf.tableComponent.getData();
    }
    this.openvpnClientComponent = new OpenvpnClientComponent(this.servicesService);
    this.openvpnServerComponent = new OpenvpnServerComponent(
      this.servicesService,
      this.dialog,
      this.loader,
      this.ws,
      this.storageService,
    );
    this.impiFormComponent = new IPMIFromComponent(this.ws, this.dialog, this.loader);
  }

  ngOnDestroy(): void {
    if (this.formEvent$) {
      this.formEvent$.complete();
    }
    this.core.unregister({ observerClass: this });
  }

  getInterfaceInOutInfo(tableSource: any[]): void {
    this.ws.sub<ReportingRealtimeUpdate>('reporting.realtime').pipe(untilDestroyed(this)).subscribe((evt) => {
      if (evt.interfaces) {
        tableSource.map((row) => {
          row.received = this.storageService.convertBytestoHumanReadable(evt.interfaces[row.id].received_bytes);
          row.received_bytes = evt.interfaces[row.id].received_bytes;
          row.sent = this.storageService.convertBytestoHumanReadable(evt.interfaces[row.id].sent_bytes);
          row.sent_bytes = evt.interfaces[row.id].sent_bytes;
          return row;
        });
      }
    });
  }

  interfaceDataSourceHelper(res: any[]): any[] {
    const rows = res;
    for (let i = 0; i < rows.length; i++) {
      // TODO: Replace with probably enum for link_state.
      rows[i]['link_state'] = rows[i]['state']['link_state'].replace('LINK_STATE_', '');
      const addresses = new Set([]);
      for (let j = 0; j < rows[i]['aliases'].length; j++) {
        const alias = rows[i]['aliases'][j];
        // TODO: See if checks can be removed or replace with enum.
        if (alias.type.startsWith('INET')) {
          addresses.add(alias.address + '/' + alias.netmask);
        }
      }

      if (rows[i]['ipv4_dhcp'] || rows[i]['ipv6_auto']) {
        for (let j = 0; j < rows[i]['state']['aliases'].length; j++) {
          const alias = rows[i]['state']['aliases'][j];
          if (alias.type.startsWith('INET')) {
            addresses.add(alias.address + '/' + alias.netmask);
          }
        }
      }
      if (rows[i].hasOwnProperty('failover_aliases')) {
        for (let j = 0; j < rows[i]['failover_aliases'].length; j++) {
          const alias = rows[i]['failover_aliases'][j];
          if (alias.type.startsWith('INET')) {
            addresses.add(alias.address + '/' + alias.netmask);
          }
        }
      }
      rows[i]['addresses'] = Array.from(addresses);
      if (rows[i].type === NetworkInterfaceType.Physical) {
        rows[i].active_media_type = rows[i]['state']['active_media_type'];
        rows[i].active_media_subtype = rows[i]['state']['active_media_subtype'];
      } else if (rows[i].type === NetworkInterfaceType.Vlan) {
        rows[i].vlan_tag = rows[i]['vlan_tag'];
        rows[i].vlan_parent_interface = rows[i]['vlan_parent_interface'];
      } else if (rows[i].type === NetworkInterfaceType.Bridge) {
        rows[i].bridge_members = rows[i]['bridge_members'];
      } else if (rows[i].type === NetworkInterfaceType.LinkAggregation) {
        rows[i].lagg_ports = rows[i]['lag_ports'];
        rows[i].lagg_protocol = rows[i]['lag_protocol'];
      }
      rows[i].mac_address = rows[i]['state']['link_address'];
    }
    return res;
  }

  ipmiDataSourceHelper(res: any[]): any[] {
    for (const item of res) {
      item.channel_lable = 'Channel' + item.channel;
    }
    return res;
  }

  getIpmiActions(): AppTableAction[] {
    return [{
      icon: 'highlight',
      name: 'identify',
      label: T('Identify Light'),
      onClick: () => {
        this.dialog.select(
          'IPMI Identify', this.impiFormComponent.options, 'IPMI flash duration', 'ipmi.identify', 'seconds',
        );
        event.stopPropagation();
      },
    }, {
      icon: 'launch',
      name: 'manage',
      label: T('Manage'),
      onClick: (rowinner: any) => {
        window.open(`http://${rowinner.ipaddress}`);
        event.stopPropagation();
      },
    }] as any[];
  }

  showConfigForm(): void {
    this.modalService.open('slide-in-form', this.addComponent);
  }

  openvpnDataSourceHelper(res: any[]): any[] {
    return res.filter((item) => {
      if (item.service.includes('openvpn_')) {
        item.service_label = item.service.charAt(8).toUpperCase() + item.service.slice(9);
        return item;
      }
    });
  }

  getOpenVpnActions(): AppTableAction[] {
    return [{
      icon: 'stop',
      name: 'stop',
      label: T('Stop'),
      onChanging: false,
      onClick: (rowinner: any) => {
        rowinner['onChanging'] = true;
        this.ws.call('service.stop', [rowinner.service]).pipe(untilDestroyed(this)).subscribe(
          (res) => {
            if (res) {
              this.dialog.Info(T('Service failed to stop'), T('OpenVPN ') + rowinner.service_label + ' ' + T('service failed to stop.'));
              rowinner.state = ServiceStatus.Running;
              rowinner['onChanging'] = false;
            } else {
              rowinner.state = ServiceStatus.Stopped;
              rowinner['onChanging'] = false;
            }
          },
          (err) => {
            rowinner['onChanging'] = false;
            this.dialog.errorReport(T('Error stopping service OpenVPN ') + rowinner.service_label, err.message, err.stack);
          },
        );
        event.stopPropagation();
      },
    }, {
      icon: 'play_arrow',
      name: 'start',
      label: T('Start'),
      onClick: (rowinner: any) => {
        rowinner['onChanging'] = true;
        this.ws.call('service.start', [rowinner.service]).pipe(untilDestroyed(this)).subscribe(
          (res) => {
            if (res) {
              rowinner.state = ServiceStatus.Running;
              rowinner['onChanging'] = false;
            } else {
              this.dialog.Info(T('Service failed to start'), T('OpenVPN ') + rowinner.service_label + ' ' + T('service failed to start.'));
              rowinner.state = ServiceStatus.Stopped;
              rowinner['onChanging'] = false;
            }
          },
          (err) => {
            rowinner['onChanging'] = false;
            this.dialog.errorReport(T('Error starting service OpenVPN ') + rowinner.service_label, err.message, err.stack);
          },
        );
        event.stopPropagation();
      },
    }] as any[];
  }

  isOpenVpnActionVisible(name: string, row: any): boolean {
    if ((name === 'start' && row.state === ServiceStatus.Running) || (name === 'stop' && row.state === ServiceStatus.Stopped)) {
      return false;
    }
    return true;
  }

  isIpmiActionVisible(name: string, row: any): boolean {
    if (name === 'manage' && row.ipaddress === '0.0.0.0') {
      return false;
    }
    return true;
  }
}
