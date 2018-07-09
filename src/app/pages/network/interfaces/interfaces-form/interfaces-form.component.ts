import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import {Validators, FormArray} from '@angular/forms';

import { NetworkService, RestService, DialogService } from '../../../../services';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  regexValidator
} from '../../../common/entity/entity-form/validators/regex-validation';
import { T } from '../../../../translate-marker';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';


@Component({
  selector : 'app-interfaces-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class InterfacesFormComponent implements OnDestroy {

  protected resource_name = 'network/interface/';
  protected route_success: string[] = [ 'network', 'interfaces' ];
  protected isEntity = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'int_interface',
      placeholder : T('NIC'),
      tooltip : T('Enter the FreeBSD device name of the interface. This\
                   cannot change after creating the interface.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'int_name',
      placeholder : T('Interface Name'),
      tooltip : T('Enter a description of interface.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'checkbox',
      name : 'int_dhcp',
      placeholder : T('DHCP'),
      tooltip : T('Only one interface can be configured for <b>DHCP</b>.\
                   Leave unset to create a static IPv4 or IPv6\
                   configuration.'),
    },
    {
      type : 'input',
      name : 'int_ipv4address',
      placeholder : T('IPv4 Address'),
      tooltip : T('Enter a static IP address in the format\
                   <i>###.###.###.###</i> when <b>DHCP</b> is unset.'),
      validation : [ regexValidator(this.networkService.ipv4_regex) ],
      relation : [
        {action : "DISABLE", when : [ {name : "int_dhcp", value : true} ]}
      ]
    },
    {
      type : 'select',
      name : 'int_v4netmaskbit',
      placeholder : T('IPv4 Netmask'),
      tooltip : T('Enter a netmask when <b>DHCP</b> is unset.'),
      options : this.networkService.getV4Netmasks(),
      relation : [
        {action : "DISABLE", when : [ {name : "int_dhcp", value : true} ]}
      ]
    },
    {
      type : 'checkbox',
      name : 'int_ipv6auto',
      placeholder : T('Auto configure IPv6'),
      tooltip : T('Set to automatically configure the IPv6 address with\
                   <a href="https://www.freebsd.org/cgi/man.cgi?query=rtsol&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                   target="_blank">rtsol(8)</a>. One interface can be\
                   configured this way.')
    },
    {
      type : 'input',
      name : 'int_ipv6address',
      placeholder : T('IPv6 Address'),
      tooltip : T('Enter a static IPv6 address when <b>DHCP</b> is unset.\
                   Example: <i>2001:0db8:85a3:0000:0000:8a2e:0370:7334</i>.'),
      validation : [ regexValidator(this.networkService.ipv6_regex) ],
      relation : [
        {action : "DISABLE", when : [ {name : "int_ipv6auto", value : true} ]}
      ]
    },
    {
      type : 'select',
      name : 'int_v6netmaskbit',
      placeholder : T('IPv6 Prefix Length'),
      tooltip : T('Set to the prefix length used on the network.'),
      options : this.networkService.getV6PrefixLength(),
      relation : [
        {action : "DISABLE", when : [ {name : "int_ipv6auto", value : true} ]}
      ]
    },
    {
      type : 'input',
      name : 'int_options',
      placeholder : T('Options'),
      tooltip : T('Enter any more parameters from <a\
                   href="https://www.freebsd.org/cgi/man.cgi?query=ifconfig&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                   target="_blank">ifconfig(8)</a>. Separate multiple\
                   parameters with a space.'),
    },
    {
      type: 'array',
      name : 'ipv4_aliases',
      initialCount: 1,
      formarray: [{
        name: 'alias_address',
        placeholder: T('IPv4 Address'),
        tooltip: T('Enter a static IP address in the format\
                    <i>###.###.###.###</i>'),
        type: 'input',
        validation : [ regexValidator(this.networkService.ipv4_regex) ]
      },
      {
        name: 'alias_netmaskbit',
        placeholder: T('IPv4 Netmask'),
        tooltip : T('Enter a netmask when <b>DHCP</b> is unset.'),
        type: 'select',
        options : this.networkService.getV4Netmasks()
      },
      {
        type: 'checkbox',
        name: 'delete',
        placeholder: T('Delete'),
        tooltip: T('Set to delete this alias.'),
      }]
    },
    {
      type: 'array',
      name : 'ipv6_aliases',
      initialCount: 1,
      formarray: [{
        name: 'alias_address',
        placeholder: T('IPv6 Address'),
        tooltip: T('Enter a static IPv6 address. Example:\
                    <i>2001:0db8:85a3:0000:0000:8a2e:0370:7334</i>'),
        type: 'input',
        validation : [ regexValidator(this.networkService.ipv6_regex) ]
      },
      {
        name: 'alias_netmaskbit',
        placeholder: T('IPv6 Prefix Length'),
        tooltip : T('Set to the prefix length used on the network.'),
        type: 'select',
        options : this.networkService.getV6PrefixLength()
      },
      {
        type: 'checkbox',
        name: 'delete',
        placeholder: T('Delete'),
        tooltip: T('Set to delete this alias.'),
      }]
    },
  ];

  private int_dhcp: any;
  private int_dhcp_subscription: any;
  private int_ipv6auto: any;
  private int_ipv6auto_subscription: any;
  private int_v4netmaskbit: any;
  private int_ipv4address: any;
  private int_v6netmaskbit: any;
  private int_ipv6address: any;
  private int_interface: any;
  private entityForm: any;
  protected ipv4formArray: FormArray;
  protected ipv6formArray: FormArray;
  protected ipv6arrayControl: any;
  protected ipv4arrayControl: any;
  protected initialCount = {'ipv4_aliases':1, 'ipv6_aliases': 1};
  protected initialCount_default = {'ipv4_aliases':1, 'ipv6_aliases': 1};
  public confirmSubmit = false;
  public confirmSubmitDialog = {
    title: T("Save Network Interface Changes"),
    message: T("Network connectivity will be interrupted. Do you want to proceed?"),
    hideCheckbox: false
  }

  public custActions: Array<any> = [
    {
      id : 'add_ipv4_alias',
      name : T('Add Additional IPv4 Alias'),
      function : () => {
        this.initialCount.ipv4_aliases += 1;
        this.entityFormService.insertFormArrayGroup(
            this.initialCount.ipv4_aliases, this.ipv4formArray, this.ipv4arrayControl.formarray);
      }
    },
    {
      id : 'remove_ipv4_alias',
      name : T('Remove Additional IPv4 Alias'),
      function : () => {
        this.initialCount.ipv4_aliases -= 1;
        this.entityFormService.removeFormArrayGroup(this.initialCount.ipv4_aliases,
                                                    this.ipv4formArray);
      }
    },
    {
      id : 'add_ipv6_alias',
      name : T('Add Additional IPv6 Alias'),
      function : () => {
        this.initialCount.ipv6_aliases += 1;
        this.entityFormService.insertFormArrayGroup(
          this.initialCount.ipv6_aliases, this.ipv6formArray, this.ipv6arrayControl.formarray);
        }
    },
    {
    id : 'remove_ipv6_alias',
    name : T('Remove Additional IPv6 Alias'),
    function : () => {
      this.initialCount.ipv6_aliases -= 1;
      this.entityFormService.removeFormArrayGroup(this.initialCount.ipv6_aliases,
                                                  this.ipv6formArray);
    }
  }];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected entityFormService: EntityFormService,
              protected networkService: NetworkService, protected dialog: DialogService) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_ipv4_alias' && this.initialCount['ipv4_aliases'] <= this.initialCount_default['ipv4_aliases']) {
      return false;
    }
    if (actionId == 'remove_ipv6_alias' && this.initialCount['ipv6_aliases'] <= this.initialCount_default['ipv6_aliases']) {
      return false;
    }
    return true;
  }

  preInit(entityForm: any) {
    this.int_interface = _.find(this.fieldConfig, {'name' : 'int_interface'});
    this.ipv4arrayControl = _.find(this.fieldConfig, {'name' : 'ipv4_aliases'});
    this.ipv6arrayControl = _.find(this.fieldConfig, {'name' : 'ipv6_aliases'});
    this.route.params.subscribe(params => {
      if(!params['pk']) {
        this.int_interface.type = 'select';
        this.int_interface.options = [];
      } else {
        this.confirmSubmit = true;
        this.ipv4arrayControl.initialCount = this.initialCount['ipv4_aliases'] 
          = this.initialCount_default['ipv4_aliases'] = 0;
        this.ipv6arrayControl.initialCount = this.initialCount['ipv6_aliases']
          = this.initialCount_default['ipv6_aliases'] = 0;
      }
    });
  }

  afterInit(entityForm: any) {
    if (entityForm.isNew) {
      this.rest.get(this.resource_name, []).subscribe((res) => {
        if (res.data.length === 0) {
          this.dialog.confirm(T("Warning"), T("Please configure the Web UI \
          interface before adding another interface. This prevents losing \
          connection to the Web UI." )).subscribe((confirm) => {
            if (!confirm) {
              entityForm.goBack();
            }
          });
        }
      });
    }
    this.ipv4formArray = entityForm.formGroup.controls['ipv4_aliases'];
    this.ipv6formArray = entityForm.formGroup.controls['ipv6_aliases'];
    this.int_ipv4address = _.find(this.fieldConfig, {'name': 'int_ipv4address'});
    this.int_ipv6address = _.find(this.fieldConfig, {'name': 'int_ipv6address'}); 
    this.int_v4netmaskbit =
        _.find(this.fieldConfig, {'name' : 'int_v4netmaskbit'});

    this.int_v6netmaskbit =
        _.find(this.fieldConfig, {'name' : 'int_v6netmaskbit'});

    this.int_dhcp = entityForm.formGroup.controls['int_dhcp'];
    this.int_ipv6auto = entityForm.formGroup.controls['int_ipv6auto'];

    this.int_ipv4address.isHidden = this.int_v4netmaskbit.isHidden = this.int_dhcp.value;
    this.int_ipv6address.isHidden = this.int_v6netmaskbit.isHidden = this.int_ipv6auto.value;

    this.int_dhcp_subscription = this.int_dhcp.valueChanges.subscribe((value) => {
      this.int_ipv4address.isHidden = this.int_v4netmaskbit.isHidden = value;
    });
    this.int_ipv6auto_subscription = this.int_ipv6auto.valueChanges.subscribe((value) => {
      this.int_ipv6address.isHidden = this.int_v6netmaskbit.isHidden = value;
    });

    if (!entityForm.isNew) {
      entityForm.setDisabled('int_interface', true);
    }
    else {
      this.networkService.getInterfaceNicChoices().subscribe((res) => {
        res.forEach((item) => {
          this.int_interface.options.push({label : item[1], value : item[0]});
        });
      });
    }
  }

  clean(data) {
    let aliases = []
    for (let i = 0; i < data.ipv4_aliases.length; i++) {
      if (!data.ipv4_aliases[i]['delete'] && 
          !!data.ipv4_aliases[i]['alias_address'] && 
          !!data.ipv4_aliases[i]['alias_netmaskbit']) {
        aliases.push(data.ipv4_aliases[i]['alias_address'] + '/' 
          + data.ipv4_aliases[i]['alias_netmaskbit']);
      }
    }
    for (let i = 0; i < data.ipv6_aliases.length; i++) {
      if (!data.ipv6_aliases[i]['delete'] && 
            !!data.ipv6_aliases[i]['alias_address'] && 
            !!data.ipv6_aliases[i]['alias_netmaskbit']) {
        aliases.push(data.ipv6_aliases[i]['alias_address'] + '/' 
           + data.ipv6_aliases[i]['alias_netmaskbit']);
      }
    }
    delete data.ipv4_aliases;
    delete data.ipv6_aliases;
    data.int_aliases = aliases;
    return data;
  }

  preHandler(data: any[]): any[] {
    let aliases = [];
    for (let i = 0; i < data.length; i++) {
      let alias = data[i].split('/');
      if (alias.length === 2) {
        aliases.push({alias_address:alias[0], alias_netmaskbit:alias[1]});
      }
    }
    return aliases;
  }

  resourceTransformIncomingRestData(data) {
    const ipv4_aliases = [];
    const ipv6_aliases = [];
    const aliases = data['int_aliases'];
    for (let i = 0; i < aliases.length; i++) {
      if (aliases[i].indexOf(':') === -1) {
        ipv4_aliases.push(aliases[i]);
      } else {
        ipv6_aliases.push(aliases[i]);
      }
    }
    data['ipv4_aliases'] = ipv4_aliases;
    data['ipv6_aliases'] = ipv6_aliases;
    return data;
  }

  ngOnDestroy() {
    this.int_dhcp_subscription.unsubscribe();
    this.int_ipv6auto_subscription.unsubscribe();
  }
}
