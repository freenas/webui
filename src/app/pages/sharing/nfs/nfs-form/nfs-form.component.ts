import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_sharing_nfs, shared } from 'app/helptext/sharing';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { T } from 'app/translate-marker';
import * as _ from 'lodash';
import { ipv4or6cidrValidator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import globalHelptext from 'app/helptext/global-helptext';
import {
  DialogService, NetworkService, RestService, WebSocketService,
} from '../../../../services';
import { UserService } from '../../../../services/user.service';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';

@Component({
  selector: 'app-nfs-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [NetworkService],
})
export class NFSFormComponent {
  protected route_success: string[] = ['sharing', 'nfs'];
  protected queryCall = 'sharing.nfs.query';
  protected editCall = 'sharing.nfs.update';
  protected addCall = 'sharing.nfs.create';
  protected pk: number;
  protected queryKey = 'id';
  protected isEntity = true;
  protected isBasicMode = true;
  entityForm: EntityFormComponent;
  save_button_enabled = true;
  productType = window.localStorage.getItem('product_type');
  hideOnScale = ['alldirs', 'quiet'];

  fieldSets = new FieldSets([
    {
      name: helptext_sharing_nfs.fieldset_paths,
      label: true,
      config: [{
        type: 'list',
        name: 'paths',
        templateListField: [{
          name: 'path',
          placeholder: helptext_sharing_nfs.placeholder_path,
          tooltip: helptext_sharing_nfs.tooltip_path,
          type: 'explorer',
          explorerType: 'directory',
          initial: '/mnt',
          required: true,
          validation: helptext_sharing_nfs.validators_path,
        }],
        listFields: [],
      }],
    },
    { name: 'divider_general', divider: true },
    {
      name: helptext_sharing_nfs.fieldset_general,
      class: 'general',
      label: true,
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext_sharing_nfs.placeholder_comment,
          tooltip: helptext_sharing_nfs.tooltip_comment,
        },
        {
          type: 'checkbox',
          name: 'alldirs',
          placeholder: helptext_sharing_nfs.placeholder_alldirs,
          tooltip: helptext_sharing_nfs.tooltip_alldirs,
        },
        {
          type: 'checkbox',
          name: 'quiet',
          placeholder: helptext_sharing_nfs.placeholder_quiet,
          tooltip: helptext_sharing_nfs.tooltip_quiet,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext_sharing_nfs.placeholder_enabled,
          tooltip: helptext_sharing_nfs.tooltip_enabled,
          value: true,
        },
      ],
    },
    { name: 'divider_access', divider: false },
    {
      name: helptext_sharing_nfs.fieldset_access,
      label: false,
      class: 'access',
      config: [
        {
          type: 'checkbox',
          name: 'ro',
          placeholder: helptext_sharing_nfs.placeholder_ro,
          tooltip: helptext_sharing_nfs.tooltip_ro,
        },
        {
          type: 'combobox',
          name: 'maproot_user',
          placeholder: helptext_sharing_nfs.placeholder_maproot_user,
          tooltip: helptext_sharing_nfs.tooltip_maproot_user,
          options: [],
          value: '',
          searchOptions: [],
          parent: this,
          updater: this.updateMapRootUserSearchOptions,
        },
        {
          type: 'combobox',
          name: 'maproot_group',
          placeholder: helptext_sharing_nfs.placeholder_maproot_group,
          tooltip: helptext_sharing_nfs.tooltip_maproot_group,
          options: [],
          value: '',
          searchOptions: [],
          parent: this,
          updater: this.updateMapRootGroupSearchOptions,
        },
        {
          type: 'combobox',
          name: 'mapall_user',
          placeholder: helptext_sharing_nfs.placeholder_mapall_user,
          tooltip: helptext_sharing_nfs.tooltip_mapall_user,
          options: [],
          value: '',
          searchOptions: [],
          parent: this,
          updater: this.updateMapAllUserSearchOptions,
        },
        {
          type: 'combobox',
          name: 'mapall_group',
          placeholder: helptext_sharing_nfs.placeholder_mapall_group,
          tooltip: helptext_sharing_nfs.tooltip_mapall_group,
          options: [],
          value: '',
          searchOptions: [],
          parent: this,
          updater: this.updateMapAllGroupSearchOptions,
        },
        {
          type: 'select',
          multiple: true,
          name: 'security',
          placeholder: helptext_sharing_nfs.placeholder_security,
          options: [
            {
              label: 'SYS',
              value: 'SYS',
            },
            {
              label: 'KRB5',
              value: 'KRB5',
            },
            {
              label: 'KRB5I',
              value: 'KRB5I',
            },
            {
              label: 'KRB5P',
              value: 'KRB5P',
            },
          ],
          isHidden: false,
          value: [],
        },
      ],
    },
    {
      name: helptext_sharing_nfs.fieldset_networks,
      label: false,
      class: 'networks',
      width: '49%',
      config: [{
        type: 'list',
        name: 'networks',
        templateListField: [{
          type: 'ipwithnetmask',
          name: 'network',
          placeholder: helptext_sharing_nfs.placeholder_network,
          tooltip: helptext_sharing_nfs.tooltip_network,
          validation: [ipv4or6cidrValidator('network')],
        }],
        listFields: [],
      }],
    },
    { name: 'spacer', width: '2%' },
    {
      name: helptext_sharing_nfs.fieldset_hosts,
      label: false,
      class: 'hosts',
      width: '49%',
      config: [{
        type: 'list',
        name: 'hosts',
        templateListField: [{
          type: 'input',
          name: 'host',
          placeholder: helptext_sharing_nfs.placeholder_hosts,
          tooltip: helptext_sharing_nfs.tooltip_hosts,
        }],
        listFields: [],
      }],
    },
    { name: 'divider', divider: true },
  ]);

  protected advanced_field: any[] = [
    'ro',
    'networks',
    'hosts',
    'maproot_user',
    'maproot_group',
    'mapall_user',
    'mapall_group',
    'security',
  ];

  protected advanced_sets = ['access', 'networks', 'hosts'];
  protected advanced_dividers = ['divider_access'];

  custActions: any[] = [
    {
      id: 'basic_mode',
      name: globalHelptext.basic_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets
          .toggleSets(this.advanced_sets)
          .toggleDividers(this.advanced_dividers);
      },
    },
    {
      id: 'advanced_mode',
      name: globalHelptext.advanced_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets
          .toggleSets(this.advanced_sets)
          .toggleDividers(this.advanced_dividers);
      },
    },
  ];

  private maproot_user: any;
  private maproot_group: any;
  private mapall_user: any;
  private mapall_group: any;

  constructor(protected router: Router,
    protected entityFormService: EntityFormService,
    protected route: ActivatedRoute,
    protected userService: UserService,
    protected rest: RestService,
    protected ws: WebSocketService, private dialog: DialogService,
    public networkService: NetworkService) {}

  preInit(EntityForm: any) {
    this.route.params.subscribe((params) => {
      if (params['pk']) {
        this.pk = parseInt(params['pk'], 10);
      }
    });

    this.ws.call('nfs.config', []).subscribe((nfsConfig) => {
      this.fieldSets.config('security').isHidden = !nfsConfig.v4;
    });
  }

  afterInit(EntityForm: EntityFormComponent) {
    this.entityForm = EntityForm;

    this.userService.userQueryDSCache().subscribe((items) => {
      const users = [{
        label: '---------',
        value: '',
      }];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      this.mapall_user = this.fieldSets.config('mapall_user');
      this.mapall_user.options = users;
      this.maproot_user = this.fieldSets.config('maproot_user');
      this.maproot_user.options = users;
    });

    this.userService.groupQueryDSCache().subscribe((items) => {
      const groups = [{
        label: '---------',
        value: '',
      }];
      for (let i = 0; i < items.length; i++) {
        groups.push({ label: items[i].group, value: items[i].group });
      }
      this.mapall_group = this.fieldSets.config('mapall_group');
      this.mapall_group.options = groups;
      this.maproot_group = this.fieldSets.config('maproot_group');
      this.maproot_group.options = groups;
    });

    if (this.productType === 'SCALE') {
      this.hideOnScale.forEach((name) => {
        this.entityForm.setDisabled(name, true, true);
      });
    }
  }

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  resourceTransformIncomingRestData(data) {
    const paths = [];
    for (let i = 0; i < data['paths'].length; i++) {
      paths.push({ path: data['paths'][i] });
    }
    data['paths'] = paths;

    const networks = [];
    for (let i = 0; i < data['networks'].length; i++) {
      networks.push({ network: data['networks'][i] });
    }
    data['networks'] = networks;

    const hosts = [];
    for (let i = 0; i < data['hosts'].length; i++) {
      hosts.push({ host: data['hosts'][i] });
    }
    data['hosts'] = hosts;

    return data;
  }

  clean(data) {
    return {
      ...data,
      paths: data.paths.filter((p) => !!p.path).map((p) => p.path),
      networks: data.networks.filter((n) => !!n.network).map((n) => n.network),
      hosts: data.hosts.filter((h) => !!h.host).map((h) => h.host),
    };
  }

  afterSave(entityForm) {
    this.ws.call('service.query', [[]]).subscribe((res) => {
      const service = _.find(res, { service: 'nfs' });
      if (service['enable']) {
        this.router.navigate(new Array('/').concat(
          this.route_success,
        ));
      } else {
        this.dialog.confirm(shared.dialog_title, shared.dialog_message,
          true, shared.dialog_button).subscribe((dialogRes) => {
          if (dialogRes) {
            entityForm.loader.open();
            this.ws.call('service.update', [service['id'], { enable: true }]).subscribe((updateRes) => {
              this.ws.call('service.start', [service.service]).subscribe((startRes) => {
                entityForm.loader.close();
                this.dialog.Info(T('NFS') + shared.dialog_started_title,
                  T('The NFS') + shared.dialog_started_message, '250px').subscribe(() => {
                  this.router.navigate(new Array('/').concat(
                    this.route_success,
                  ));
                });
              }, (err) => {
                entityForm.loader.close();
                this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
                this.router.navigate(new Array('/').concat(
                  this.route_success,
                ));
              });
            }, (err) => {
              entityForm.loader.close();
              this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
              this.router.navigate(new Array('/').concat(
                this.route_success,
              ));
            });
          } else {
            this.router.navigate(new Array('/').concat(
              this.route_success,
            ));
          }
        });
      }
    });
  }

  updateMapAllGroupSearchOptions(value = '', parent) {
    parent.updateGroupSearchOptions(value, parent, 'mapall_group');
  }

  updateMapRootGroupSearchOptions(value = '', parent) {
    parent.updateGroupSearchOptions(value, parent, 'maproot_group');
  }

  updateGroupSearchOptions(value = '', parent, field) {
    parent.userService.groupQueryDSCache(value).subscribe((items) => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({ label: items[i].group, value: items[i].group });
      }
      parent[field].searchOptions = groups;
    });
  }

  updateMapAllUserSearchOptions(value = '', parent) {
    parent.updateUserSearchOptions(value, parent, 'mapall_user');
  }

  updateMapRootUserSearchOptions(value = '', parent) {
    parent.updateUserSearchOptions(value, parent, 'maproot_user');
  }

  updateUserSearchOptions(value = '', parent, field) {
    parent.userService.userQueryDSCache(value).subscribe((items) => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      parent[field].searchOptions = users;
    });
  }
}
