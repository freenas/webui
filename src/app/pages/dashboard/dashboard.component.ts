import {
  Component, OnInit, AfterViewInit, OnDestroy, ElementRef,
} from '@angular/core';
import { CoreService } from 'app/core/services/core.service';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { CoreEvent } from 'app/interfaces/events';
import { NicInfoEvent } from 'app/interfaces/events/nic-info-event.interface';
import { PoolDataEvent } from 'app/interfaces/events/pool-data-event.interface';
import { SysInfoEvent, SystemInfoWithFeatures } from 'app/interfaces/events/sys-info-event.interface';
import {
  NetworkInterface,
  NetworkInterfaceState,
} from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingRealtimeUpdate, VirtualMemoryUpdate } from 'app/interfaces/reporting.interface';

import { Subject } from 'rxjs';
import { MediaObserver } from '@angular/flex-layout';

import { WebSocketService } from '../../services';
import { ModalService } from 'app/services/modal.service';
import { DashConfigItem } from 'app/core/components/widgets/widgetcontroller/widgetcontroller.component';
import { tween, styler } from 'popmotion';
import { EntityFormConfigurationComponent } from 'app/pages/common/entity/entity-form/entity-form-configuration.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { T } from 'app/translate-marker';
import { untilDestroyed } from '@ngneat/until-destroy';

// TODO: This adds additional fields. Unclear if vlan is coming from backend
type DashboardNetworkInterface = NetworkInterface & {
  state: NetworkInterfaceState & {
    vlans: any[];
    lagg_ports: string[];
  };
};

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  formComponent: EntityFormConfigurationComponent;
  formEvents: Subject<CoreEvent>;
  actionsConfig: any;

  screenType = 'Desktop'; // Desktop || Mobile
  optimalDesktopWidth = '100%';
  widgetWidth = 540; // in pixels (Desktop only)

  dashStateReady = false;
  dashState: DashConfigItem[]; // Saved State
  activeMobileWidget: DashConfigItem[] = [];
  availableWidgets: DashConfigItem[] = [];

  get renderedWidgets(): DashConfigItem[] {
    return this.dashState.filter((widget) => widget.rendered);
  }

  large = 'lg';
  medium = 'md';
  small = 'sm';
  zPoolFlex = '100';
  noteFlex = '23';

  statsDataEvents: Subject<CoreEvent>;
  private statsEvents: any;
  tcStats: any;

  // For empty state
  get empty(): boolean {
    const rendered = this.dashState.filter((widget) => widget.rendered);
    return rendered.length == 0;
  }

  emptyDashConf: EmptyConfig = {
    type: EmptyType.no_page_data,
    large: true,
    title: T('Dashboard is Empty!'),
    message: T('You have hidden all of your available widgets. Use the dashboard configuration form to add widgets.'),
    button: {
      label: 'Configure Dashboard',
      action: () => {
        this.showConfigForm();
      },
    },
  };

  // For widgetsysinfo
  isHA: boolean; // = false;
  sysinfoReady = false;

  // For CPU widget
  systemInformation: SystemInfoWithFeatures;

  // For widgetpool
  system: any;
  system_product = 'Generic';
  pools: Pool[]; // = [];
  volumeData: any; //= {};

  nics: DashboardNetworkInterface[];

  animation = 'stop';
  shake = false;

  showSpinner = true;

  constructor(protected core: CoreService, protected ws: WebSocketService,
    public mediaObserver: MediaObserver, private el: ElementRef, public modalService: ModalService) {
    core.register({ observerClass: this, eventName: 'SidenavStatus' }).pipe(untilDestroyed(this)).subscribe(() => {
      setTimeout(() => {
        this.checkScreenSize();
      }, 100);
    });

    this.statsDataEvents = new Subject<CoreEvent>();

    this.checkScreenSize();

    window.onresize = () => {
      this.checkScreenSize();
    };
  }

  ngAfterViewInit(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    const st = window.innerWidth < 600 ? 'Mobile' : 'Desktop';

    // If leaving .xs screen then reset mobile position
    if (st == 'Desktop' && this.screenType == 'Mobile') {
      this.onMobileBack();
    }

    this.screenType = st;

    // Eliminate top level scrolling
    const wrapper = document.querySelector<HTMLElement>('.fn-maincontent');
    wrapper.style.overflow = this.screenType == 'Mobile' ? 'hidden' : 'auto';
    this.optimizeWidgetContainer();
  }

  optimizeWidgetContainer(): void {
    const wrapper = document.querySelector<HTMLElement>('.rightside-content-hold');

    const withMargin = this.widgetWidth + 8;
    const max = Math.floor(wrapper.offsetWidth / withMargin);
    const odw = max * withMargin;
    this.optimalDesktopWidth = odw.toString() + 'px';
  }

  onMobileLaunch(evt: DashConfigItem): void {
    this.activeMobileWidget = [evt];

    // Transition
    const vp = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(vp);
    const c = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(c);
    const vpw = viewport.get('width'); // 600;

    const startX = 0;
    const endX = vpw * -1;

    tween({
      from: { x: startX },
      to: { x: endX },
      duration: 250,
    }).start(carousel.set);
  }

  onMobileBack(): void {
    // Transition
    const vp = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(vp);
    const c = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(c);
    const vpw = viewport.get('width'); // 600;

    const startX = vpw * -1;
    const endX = 0;

    tween({
      from: { x: startX },
      to: { x: endX },
      duration: 250,
    }).start({
      update: (v: any) => {
        carousel.set(v);
      },
      complete: () => {
        this.activeMobileWidget = [];
      },
    });
  }

  onMobileResize(evt: Event): void {
    if (this.screenType == 'Desktop') { return; }
    const vp = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(vp);
    const c = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(c);

    const startX = viewport.get('x');
    const endX = this.activeMobileWidget.length > 0 ? (evt.target as Window).innerWidth * -1 : 0;

    if (startX !== endX) {
      carousel.set('x', endX);
    }
  }

  ngOnInit(): void {
    this.init();

    this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((hasFailover) => {
      if (hasFailover) {
        this.isHA = true;
      }
    });
    this.sysinfoReady = true;
  }

  ngOnDestroy(): void {
    this.stopListeners();
    this.core.unregister({ observerClass: this });

    // Restore top level scrolling
    const wrapper = document.querySelector<HTMLElement>('.fn-maincontent');
    wrapper.style.overflow = 'auto';
  }

  init(): void {
    this.startListeners();

    this.core.register({ observerClass: this, eventName: 'NicInfo' }).pipe(untilDestroyed(this)).subscribe((evt: NicInfoEvent) => {
      const clone = [...evt.data] as DashboardNetworkInterface[];
      const removeNics: { [nic: string]: number | string } = {};

      // Store keys for fast lookup
      const nicKeys: { [nic: string]: number | string } = {};
      evt.data.forEach((item, index) => {
        nicKeys[item.name] = index.toString();
      });

      // Process Vlans (attach vlans to their parent)
      evt.data.forEach((item, index) => {
        if (item.type !== NetworkInterfaceType.Vlan && !clone[index].state.vlans) {
          clone[index].state.vlans = [];
        }

        if (item.type == NetworkInterfaceType.Vlan) {
          const parentIndex = parseInt(nicKeys[item.state.parent] as string);
          if (!clone[parentIndex].state.vlans) {
            clone[parentIndex].state.vlans = [];
          }

          clone[parentIndex].state.vlans.push(item.state);
          removeNics[item.name] = index;
        }
      });

      // Process LAGGs
      evt.data.forEach((item, index) => {
        if (item.type == NetworkInterfaceType.LinkAggregation) {
          clone[index].state.lagg_ports = item.lag_ports;
          item.lag_ports.forEach((nic) => {
            // Consolidate addresses
            clone[index].state.aliases.forEach((item: any) => { item.interface = nic; });
            clone[index].state.aliases = clone[index].state.aliases.concat(clone[nicKeys[nic] as number].state.aliases);

            // Consolidate vlans
            clone[index].state.vlans.forEach((item) => { item.interface = nic; });
            clone[index].state.vlans = clone[index].state.vlans.concat(clone[nicKeys[nic] as number].state.vlans);

            // Mark interface for removal
            removeNics[nic] = nicKeys[nic];
          });
        }
      });

      // Remove NICs from list
      for (let i = clone.length - 1; i >= 0; i--) {
        if (removeNics[clone[i].name]) {
          // Remove
          clone.splice(i, 1);
        } else {
          // Only keep INET addresses
          clone[i].state.aliases = clone[i].state.aliases.filter((address) =>
            [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(address.type));
        }
      }

      // Update NICs array
      this.nics = clone;

      this.isDataReady();
    });

    this.core.emit({ name: 'VolumeDataRequest' });
    this.core.emit({ name: 'NicInfoRequest' });
    this.getDisksData();
  }

  startListeners(): void {
    this.core.register({ observerClass: this, eventName: 'UserAttributes' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.dashState) {
        this.applyState(evt.data.dashState);
      }
      this.dashStateReady = true;
    });

    this.statsEvents = this.ws.sub<ReportingRealtimeUpdate>('reporting.realtime').pipe(untilDestroyed(this)).subscribe((update) => {
      if (update.cpu) {
        this.statsDataEvents.next({ name: 'CpuStats', data: update.cpu });
      }

      if (update.virtual_memory) {
        const memStats: VirtualMemoryUpdate & { arc_size?: number } = { ...update.virtual_memory };

        if (update.zfs && update.zfs.arc_size != null) {
          memStats.arc_size = update.zfs.arc_size;
        }
        this.statsDataEvents.next({ name: 'MemoryStats', data: memStats });
      }

      if (update.interfaces) {
        const keys = Object.keys(update.interfaces);
        keys.forEach((key) => {
          const data = update.interfaces[key];
          this.statsDataEvents.next({ name: 'NetTraffic_' + key, data });
        });
      }
    });
  }

  stopListeners(): void {
    // unsubscribe from middleware
    if (this.statsEvents) {
      this.statsEvents.complete();
    }

    // unsubsribe from global actions
    if (this.formEvents) {
      this.formEvents.complete();
    }
  }

  setVolumeData(evt: CoreEvent): void {
    const vd: any = {};

    for (const i in evt.data) {
      if (typeof evt.data[i] == undefined || !evt.data[i]) { continue; }

      let avail = null;
      const used_pct = evt.data[i].used.parsed / (evt.data[i].used.parsed + evt.data[i].available.parsed);
      avail = evt.data[i].available.parsed;

      const zvol = {
        avail,
        id: evt.data[i].id,
        name: evt.data[i].name,
        used: evt.data[i].used.parsed,
        used_pct: (used_pct * 100).toFixed(0) + '%',
      };

      vd[zvol.id] = zvol;
    }
    this.volumeData = vd;
  }

  getDisksData(): void {
    this.core.register({ observerClass: this, eventName: 'PoolData' }).pipe(untilDestroyed(this)).subscribe((evt: PoolDataEvent) => {
      this.pools = evt.data;

      if (this.pools.length > 0) {
        this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]).pipe(untilDestroyed(this)).subscribe((datasets) => {
          this.setVolumeData({
            name: 'RootDatasets',
            data: datasets,
          });
          this.isDataReady();
        });
      } else {
        const clone = { ...evt };
        clone.data = [];
        this.setVolumeData(clone);
        this.isDataReady();
      }
    });

    this.core.register({ observerClass: this, eventName: 'SysInfo' }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      if (typeof this.systemInformation == 'undefined') {
        this.systemInformation = evt.data;
        if (!this.pools || this.pools.length == 0) {
          this.core.emit({ name: 'PoolDataRequest', sender: this });
        }
      }
    });

    this.core.emit({ name: 'SysInfoRequest', sender: this });
  }

  isDataReady(): void {
    const isReady = !!(this.statsDataEvents && typeof this.pools !== undefined && this.volumeData && this.nics);

    if (isReady) {
      this.availableWidgets = this.generateDefaultConfig();
      if (!this.dashState) {
        this.dashState = this.availableWidgets;
      }

      this.formEvents = new Subject();
      this.formEvents.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
        switch (evt.name) {
          case 'FormSubmit':
            this.formHandler(evt);
            break;
          case 'ToolbarChanged':
            this.showConfigForm();
            break;
        }
      });

      // Setup Global Actions
      const actionsConfig = {
        actionType: EntityToolbarComponent,
        actionConfig: {
          target: this.formEvents,
          controls: [
            {
              name: 'dashConfig',
              label: 'Configure',
              type: 'button',
              value: 'click',
              color: 'primary',
            },
          ],
        },
      };

      this.actionsConfig = actionsConfig;

      this.core.emit({ name: 'GlobalActions', data: actionsConfig, sender: this });
      this.core.emit({ name: 'UserAttributesRequest' }); // Fetch saved dashboard state
    }
  }

  generateDefaultConfig(): DashConfigItem[] {
    const conf: DashConfigItem[] = [
      { name: 'System Information', rendered: true, id: '0' },
    ];

    if (this.isHA) {
      conf.push({
        name: 'System Information(Standby)', identifier: 'passive,true', rendered: true, id: conf.length.toString(),
      });
    }

    conf.push({ name: 'CPU', rendered: true, id: conf.length.toString() });
    conf.push({ name: 'Memory', rendered: true, id: conf.length.toString() });

    this.pools.forEach((pool) => {
      conf.push({
        name: 'Pool', identifier: 'name,' + pool.name, rendered: true, id: conf.length.toString(),
      });
    });

    this.nics.forEach((nic) => {
      conf.push({
        name: 'Interface', identifier: 'name,' + nic.name, rendered: true, id: conf.length.toString(),
      });
    });

    return conf;
  }

  volumeDataFromConfig(item: DashConfigItem): any {
    const spl = item.identifier.split(',');
    const key = spl[0] as keyof Pool;
    const value = spl[1];

    const pool = this.pools.filter((pool) => pool[key] == value);
    return this.volumeData && this.volumeData[pool[0].name] ? this.volumeData[pool[0].name] : '';
  }

  dataFromConfig(item: DashConfigItem): any {
    let spl: string[];
    let key: string;
    let value: string;
    if (item.identifier) {
      spl = item.identifier.split(',');
      key = spl[0];
      value = spl[1];
    }

    let data: any;

    switch (item.name.toLowerCase()) {
      case 'cpu':
        data = this.statsDataEvents;
        break;
      case 'memory':
        data = this.statsDataEvents;
        break;
      case 'pool':
        data = spl
          ? this.pools.filter((pool) => pool[key as keyof Pool] == value)
          : console.warn('DashConfigItem has no identifier!');
        if (data) { data = data[0]; }
        break;
      case 'interface':
        data = spl
          ? this.nics.filter((nic) => nic[key as keyof DashboardNetworkInterface] == value)
          : console.warn('DashConfigItem has no identifier!');
        if (data) { data = data[0].state; }
        break;
    }

    return data || console.warn('Data for this widget is not available!');
  }

  toggleShake(): void {
    if (this.shake) {
      this.shake = false;
    } else if (!this.shake) {
      this.shake = true;
    }
  }

  showConfigForm(): void {
    // this.modalService.open('slide-in-form', this.addComponent);
    if (this.formComponent) {
      delete this.formComponent;
    }
    this.generateFormComponent();
    this.modalService.open('slide-in-form', this.formComponent);
  }

  generateFormComponent(): void {
    const widgetTypes: any[] = [];
    this.dashState.forEach((item) => {
      if (widgetTypes.indexOf(item.name) == -1) {
        widgetTypes.push(item.name);
      }
    });

    /* let fieldSets = widgetTypes.map((widgetType) => {
      return {
        name: widgetType,
        width: '100%',
        label: true,
        config: this.dashState.filter((w) => w.name == widgetType).map((widget) => {
          let ph;
          if(widget.identifier){
            let spl = widget.identifier.split(',');
            ph = spl[1];
          } else {
            ph = widget.name;
          }

          return {
            type: 'checkbox',
            name: ph,
            value: widget.rendered,
            placeholder: ph,
          }
        })
      }
    }); */

    const fieldSets = [
      {
        name: 'Toggle Widget Visibility',
        width: '100%',
        label: true,
        config: this.dashState.map((widget) => {
          let ph;
          if (widget.identifier) {
            const spl = widget.identifier.split(',');
            ph = spl[1];
          } else {
            ph = widget.name;
          }

          return {
            type: 'checkbox',
            name: ph,
            value: widget.rendered,
            placeholder: ph,
          };
        }),
      },
    ];

    this.formComponent = new EntityFormConfigurationComponent();
    this.formComponent.fieldSets = new FieldSets(fieldSets);
    this.formComponent.title = 'Dashboard Configuration';
    this.formComponent.isOneColumnForm = true;
    this.formComponent.formType = 'EntityFormComponent';
    this.formComponent.target = this.formEvents;
  }

  formHandler(evt: CoreEvent): void {
    // This method handles the form data

    const clone = Object.assign([], this.dashState);
    const keys = Object.keys(evt.data);

    // Apply
    keys.forEach((key) => {
      const value = evt.data[key];
      const dashItem = clone.filter((w) => {
        if (w.identifier) {
          const spl = w.identifier.split(',');
          const name = spl[1];
          return key == name;
        }
        return key == w.name;
      });

      dashItem[0].rendered = value;
    });

    this.dashState = clone;
    this.modalService.close('slide-in-form');/* .then( closed => {
    }); */

    // Save
    this.ws.call('user.set_attribute', [1, 'dashState', clone]).pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res) {
        throw 'Unable to save Dashboard State';
      }
    });
  }

  applyState(state: any[]): void {
    // This reconciles current state with saved dashState

    if (!this.dashState) {
      console.warn('Cannot apply saved state to dashboard. Property dashState does not exist!');
      return;
    }

    const clone = Object.assign([], this.dashState);
    clone.forEach((widget, index) => {
      const matches = state.filter((w) => {
        const key = widget.identifier ? 'identifier' : 'name';

        return widget[key] == w[key];
      });

      if (matches.length == 1) {
        clone[index] = matches[0];
      }
    });

    this.dashState = clone;
  }
}
