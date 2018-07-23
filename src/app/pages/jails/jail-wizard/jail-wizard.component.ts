import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from '../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';
import { JailService, NetworkService, DialogService } from '../../../services';
import { EntityUtils } from '../../common/entity/utils';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';
import { T } from '../../../translate-marker'

@Component({
  selector: 'jail-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers: [JailService, NetworkService]
})
export class JailWizardComponent {

  protected addWsCall = 'jail.create';
  public route_success: string[] = ['jails'];
  public summary = {};
  summary_title = "Jail Summary";
  objectKeys = Object.keys;

  isLinear = true;
  firstFormGroup: FormGroup;
  protected custActions: Array<any> = [
  {
    id: 'advanced_add',
    name: "Advanced Jail Creation",
    function: () => {
      this.router.navigate(
        new Array('').concat(["jails", "add", "advanced"])
      );
    }
  }];

  protected wizardConfig: Wizard[] = [{
      label: T('Name Jail and Choose FreeBSD Release'),
      fieldConfig: [{
          type: 'input',
          name: 'uuid',
          required: true,
          placeholder: T('Jail Name'),
          tooltip: T('Required. Can only contain alphanumeric characters \
                      Aa-Zz 0-9), dashes (-), or underscores (_).'),
          validation: [ regexValidator(/^[a-zA-Z0-9-_]+$/) ],
        },
        {
          type: 'select',
          name: 'release',
          required: true,
          placeholder: T('Release'),
          tooltip: T('Choose the FreeBSD release to use as the jail \
                      operating system. Releases that have already \
                      been downloaded show <b>(fetched)</b>.'),
          options: [],
        },
      ]
    },
    {
      label: T('Configure Networking'),
      fieldConfig: [{
          type: 'checkbox',
          name: 'dhcp',
          placeholder: T('DHCP Autoconfigure IPv4'),
          tooltip: T('Set to autoconfigure jail networking with the \
                      Dynamic Host Configuration Protocol. <b>VNET</b> \
                      is required.'),
      },
        {
          type: 'checkbox',
          name: 'vnet',
          placeholder: T('VNET'),
	        tooltip: T('Set to use <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=vnet&sektion=9"\
                  target="_blank">VNET(9)</a> to emulate network \
                  devices for the jail. \
                  A fully virtualized per-jail network stack will be \
                  installed.'),
          required: false,
          hasErrors: false,
          errors: '',
          value: false,
        },
        {
          type: 'select',
          name: 'ip4_interface',
          placeholder: T('IPv4 interface'),
          tooltip: T('IPv4 interface for the jail.'),
          options: [
            {
              label: 'vnet0',
              value: 'vnet0',
            }
          ],
          value: 'vnet0',
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'dhcp',
              value: true,
            }]
          }],
          class: 'inline',
          width: '30%',
        },
        {
          type: 'input',
          name: 'ip4_addr',
          placeholder: T('IPv4 Address'),
          tooltip: T('IPv4 address for the jail.'),
          validation : [ regexValidator(this.networkService.ipv4_regex) ],
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'dhcp',
              value: true,
            }]
          }],
          class: 'inline',
          width: '50%',
        },
        {
          type: 'select',
          name: 'ip4_netmask',
          placeholder: T('IPv4 Netmask'),
          tooltip: T('IPv4 netmask for the jail.'),
          options: [
            {
              label: '------',
              value: '',
            }
          ],
          value: '',
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'dhcp',
              value: true,
            }]
          }],
          required: false,
          class: 'inline',
          width: '20%',
        },
        {
          type: 'input',
          name: 'defaultrouter',
          placeholder: T('Default Router For IPv4'),
          tooltip: T('A valid IPv4 address to use as the default route. \
                      <br>Enter <b>none</b> to configure the jail with \
                      no IPv4 default route. <br>\
                      <b>A jail without a default route will not be \
                      able to access any networks.</b>'),
          relation: [{
            action: 'DISABLE',
            connective: 'OR',
            when: [{
              name: 'dhcp',
              value: true,
            }, {
              name: 'vnet',
              value: false,
            }]
          }]
        },
        {
          type: 'select',
          name: 'ip6_interface',
          placeholder: T('IPv6 Interface'),
          tooltip: T('IPv6 interface for the jail.'),
          options: [
            {
              label: 'vnet0',
              value: 'vnet0',
            }
          ],
          value: 'vnet0',
          class: 'inline',
          width: '30%',
        },
        {
          type: 'input',
          name: 'ip6_addr',
          placeholder: T('IPv6 Address'),
          tooltip: T('IPv6 address for the jail.'),
          validation : [ regexValidator(this.networkService.ipv6_regex) ],
          class: 'inline',
          width: '30%',
        },
        {
          type: 'select',
          name: 'ip6_prefix',
          placeholder: T('IPv6 Prefix'),
          tooltip: T('IPv6 prefix for the jail.'),
          options: [],
          class: 'inline',
          width: '20%',
        },
        {
          type: 'input',
          name: 'defaultrouter6',
          placeholder: T('Default Router For IPv6'),
      tooltip: T('A valid IPv6 address to use as the default route. \
                  <br>Enter <b>none</b> to configure the jail with no \
                  IPv6 default route. <br>\
                  <b>A jail without a default route will not be able \
                  to access any networks.</b>'),
        },
      ]
    },
  ]

  protected releaseField: any;
  protected currentServerVersion: any;
  protected ip4_interfaceField: any;
  protected ip4_netmaskField: any;
  protected ip6_interfaceField: any;
  protected ip6_prefixField: any;

  public ipv4: any;
  public ipv6: any;
  constructor(protected rest: RestService,
              protected ws: WebSocketService,
              protected jailService: JailService,
              protected router: Router,
              protected networkService: NetworkService,
              protected dialogService: DialogService) {

  }

  preInit() {
    this.releaseField = _.find(this.wizardConfig[0].fieldConfig, { 'name': 'release' });
    this.ws.call('system.info').subscribe((res) => {
        this.currentServerVersion = Number(_.split(res.version, '-')[1]);
        this.jailService.getLocalReleaseChoices().subscribe(
          (res_local) => {
            for (let j in res_local) {
              let rlVersion = Number(_.split(res_local[j], '-')[0]);
              if (this.currentServerVersion >= Math.floor(rlVersion)) {
                this.releaseField.options.push({ label: res_local[j] + '(fetched)', value: res_local[j] });
              }
            }
            this.jailService.getRemoteReleaseChoices().subscribe(
              (res_remote) => {
                for (let i in res_remote) {
                  if (_.indexOf(res_local, res_remote[i]) < 0) {
                    let rmVersion = Number(_.split(res_remote[i], '-')[0]);
                    if (this.currentServerVersion >= Math.floor(rmVersion)) {
                      this.releaseField.options.push({ label: res_remote[i], value: res_remote[i] });
                    }
                  }
                }
              },
              (res_remote) => {
                this.dialogService.errorReport(T('Error: Get remote release choices failed'), res_remote.reason, res_remote.trace.formatted);
              });
          },
          (res_local) => {
            this.dialogService.errorReport(T('Error: Get local fetched release choices failed'), res_local.reason, res_local.trace.formatted);
          });
      },
      (res) => {
        new EntityUtils().handleError(this, res);
      });

    this.ip4_interfaceField = _.find(this.wizardConfig[1].fieldConfig, {'name': 'ip4_interface'});
    this.ip4_netmaskField = _.find(this.wizardConfig[1].fieldConfig, {'name': 'ip4_netmask'});
    this.ip6_interfaceField = _.find(this.wizardConfig[1].fieldConfig, {'name': 'ip6_interface'});
    this.ip6_prefixField = _.find(this.wizardConfig[1].fieldConfig, {'name': 'ip6_prefix'});
    // get netmask/prefix for ipv4/6
    let v4netmask = this.networkService.getV4Netmasks();
    let v6prefix = this.networkService.getV6PrefixLength();
    for (let i = 0; i < v4netmask.length; i++) {
      this.ip4_netmaskField.options.push(v4netmask[i]);
    }
    for (let i = 0; i < v6prefix.length; i++) {
      this.ip6_prefixField.options.push(v6prefix[i]);
    }
    // get interface options
    this.ws.call('interfaces.query', [[["name", "rnin", "vnet0:"]]]).subscribe(
      (res)=>{
        for (let i in res) {
          this.ip4_interfaceField.options.push({ label: res[i].name, value: res[i].name});
          this.ip6_interfaceField.options.push({ label: res[i].name, value: res[i].name});
        }
      },
      (res)=>{
        new EntityUtils().handleError(this, res);
      }
    );
  }

  updateIpAddress(entityWizard, type) {
    if (type == 'ipv4') {
      let ip4_interface_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip4_interface'];
      let ip4_address_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip4_addr'];
      let ip4_netmask_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip4_netmask'];
      if (ip4_address_control.value == undefined || ip4_address_control.value == '') {
        delete this.summary[T('IPv4 Address')];
        this.ip4_netmaskField.required = false;
      } else {
        this.ip4_netmaskField.required = true;
        this.summary[T('IPv4 Address')] = ip4_interface_control.value + '|' + ip4_address_control.value + '/' + ip4_netmask_control.value;
      }
      this.ipv4 = this.summary[T('IPv4 Address')];
    } else {
      let ip6_interface_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip6_interface'];
      let ip6_address_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip6_addr'];
      let ip6_prefix_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip6_prefix'];
      if (ip6_address_control.value == undefined || ip6_address_control.value == '') {
        delete this.summary[T('IPv6 Address')];
        this.ip6_prefixField.required = false;
      } else {
        this.ip6_prefixField.required = true;
        this.summary[T('IPv6 Address')] = ip6_interface_control.value + '|' + ip6_address_control.value + '/' + ip6_prefix_control.value;
      }
      this.ipv6 = this.summary[T('IPv6 Address')];
    }
  }

  afterInit(entityWizard: EntityWizardComponent) {
    ( < FormGroup > entityWizard.formArray.get([0]).get('uuid')).valueChanges.subscribe((res) => {
      this.summary[T('Jail Name')] = res;
    });
    ( < FormGroup > entityWizard.formArray.get([0])).get('release').valueChanges.subscribe((res) => {
      this.summary[T('Release')] = res;
    });
    // update ipv4
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip4_interface').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv4');
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip4_netmask').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv4');
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip4_addr').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv4');
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('defaultrouter')).valueChanges.subscribe((res) => {
      if (res == undefined || res == '') {
        delete this.summary[T('Default Router For IPv4')];
      } else {
        this.summary[T('Default Router For IPv4')] = res;
      }
    });
    // update ipv6
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip6_interface').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv6');
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip6_prefix').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv6');
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip6_addr').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv6');
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('defaultrouter6')).valueChanges.subscribe((res) => {
      if (res == undefined || res == '') {
        delete this.summary[T('Default Router For IPv6')];
      } else {
        this.summary[T('Default Router For IPv6')] = res;
      }
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('dhcp')).valueChanges.subscribe((res) => {
      this.summary[T('DHCP Autoconfigure IPv4')] = res ? T('Yes') : T('No');

      if (res) {
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vnet'].setValue(true);
      }
      _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).required = res;
    });
    ( < FormGroup > entityWizard.formArray.get([1]).get('vnet')).valueChanges.subscribe((res) => {
      this.summary[T('VNET Virtual Networking')] = res ? T('Yes') : T('No');

      if (( < FormGroup > entityWizard.formArray.get([1])).controls['dhcp'].value && !res) {
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).hasErrors = true;
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).errors = 'Vnet is required';
      } else {
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).hasErrors = false;
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).errors = '';
      }
    });
  }

  beforeSubmit(value) {
    let property: any = [];
    delete value['ip4_interface'];
    delete value['ip4_netmask'];
    value['ip4_addr'] = this.ipv4;
    delete value['ip6_interface'];
    delete value['ip6_prefix'];
    value['ip6_addr'] = this.ipv6;

    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        if (value[i] == undefined) {
          delete value[i];
        } else {
          if (i == 'dhcp' || i == 'vnet') {
            if (i == 'dhcp') {
              property.push('bpf=yes');
            }

            if (value[i]) {
              property.push(i + '=on');
            } else {
              property.push(i + '=off');
            }
            delete value[i];
          } else {
            if (i != 'uuid' && i != 'release') {
              property.push(i + '=' + value[i]);
              delete value[i];
            }
          }
        }
      }
    }
    value['props'] = property;

    return value;
  }

  isCustActionVisible(id, stepperIndex) {
    if (stepperIndex == 0) {
      return true;
    }
    return false;
  }

}
