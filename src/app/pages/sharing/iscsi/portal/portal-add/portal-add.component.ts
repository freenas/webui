import { Component } from '@angular/core';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { IscsiService } from '../../../../../services/';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';
import { T } from '../../../../../translate-marker';

@Component({
  selector : 'app-iscsi-portal-add',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ IscsiService, EntityFormService ],
})
export class PortalAddComponent {

  protected resource_name: string = 'services/iscsi/portal/';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'portals' ];
  protected isEntity: boolean = true;

  protected portal_ip_count: number = 1;
  protected arrayControl: any;
  protected arrayModel: any;
  protected formArray: FormArray;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'iscsi_target_portal_comment',
      placeholder : T('Comment'),
      tooltip: T('Optional description. Portals are automatically\
                  assigned a numeric group ID.'),
    },
    {
      type : 'select',
      name : 'iscsi_target_portal_discoveryauthmethod',
      placeholder : T('Discovery Auth Method'),
      tooltip: T('<a href="..//docs/sharing.html#block-iscsi"\
                  target="_blank">iSCSI</a> supports multiple\
                  authentication methods that are used by the target to\
                  discover valid devices. <i>None</i> allows anonymous\
                  discovery while <i>CHAP</i> and <i>Mutual CHAP</i>\
                  require authentication.'),
      options : [
        {
          label : 'NONE',
          value : 'None',
        },
        {
          label : 'CHAP',
          value : 'Chap',
        },
        {
          label : 'Mutual CHAP',
          value : 'mutual_chap',
        }
      ],
      value: 'None',
    },
    {
      type : 'select',
      name : 'iscsi_target_portal_discoveryauthgroup',
      placeholder : T('Discovery Auth Group'),
      tooltip: T('Select a user created in <b>Authorized Access</b> if\
                  the <b>Discovery Auth Method</b> is set to\
                  <i>CHAP</i> or <i>Mutual CHAP</i>.'),
      options : [ {
        label : 'NONE',
        value : '',
      } ],
      value: '',
    },
    {
      type : 'array',
      name : "iscsi_target_portal_ips",
      initialCount : 1,
      formarray : [
        {
          type : 'select',
          name : 'ip',
          placeholder : T('IP Address'),
          tooltip: T('Select the IP address associated with an interface\
                      or the wildcard address of <i>0.0.0.0</i>\
                      (any interface).'),
          value : '0.0.0.0',
          options : [],
          required: true,
          validation: [ Validators.required ],
        },
        {
          type : 'input',
          name : 'port',
          placeholder : T('Port'),
          tooltip: T('TCP port used to access the iSCSI target.\
                      Default is <i>3260</i>.'),
          value : '3260',
          required: true,
          validation: [ Validators.required ],
        }
      ]
    }
  ];

  public custActions: Array<any> = [
    {
      id : 'add_extra_portal_ip',
      name : 'Add Extra Portal IP',
      function : () => {
        this.portal_ip_count += 1;
        this.entityFormService.insertFormArrayGroup(this.portal_ip_count, this.formArray, this.arrayControl.formarray);
      }
    },
    {
      id : 'remove_extra_portal_ip',
      name : 'Remove Extra Portal IP',
      function : () => {
        this.portal_ip_count -= 1;
        this.entityFormService.removeFormArrayGroup(this.portal_ip_count, this.formArray);
      }
    },
  ];

  constructor(protected router: Router, protected iscsiService: IscsiService, protected entityFormService: EntityFormService) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_extra_portal_ip' && this.portal_ip_count <= 1) {
      return false;
    }
    return true;
  }

  afterInit(entityForm: any) {
    this.formArray =
        entityForm.formGroup.controls['iscsi_target_portal_ips'] as FormArray;
    this.arrayControl =
        _.find(this.fieldConfig, {'name' : 'iscsi_target_portal_ips'});
    this.arrayModel = _.find(this.arrayControl.formarray, {'name' : 'ip'});
    this.portal_ip_count = this.arrayControl.initialCount;

    this.iscsiService.getIpChoices().subscribe((res) => {
      this.arrayModel.options.push({label : '0.0.0.0', value : '0.0.0.0'});
      res.forEach((item) => {
        this.arrayModel.options.push({label : item[1], value : item[0]});
      });
    });
  }

  getIPs(data: any[]): any[] {
    var IPs = new Array();
    for (let i in data) {
      if ('ip' in data[i] && 'port' in data[i]) {
        let ip = data[i]['ip'] + ':' + data[i]['port'];
        IPs.push(ip);
      }
    }
    return IPs;
  }

  beforeSubmit(value: any) {
    for (let i in value) {
      if (Array.isArray(value[i])) {
        value[i] = this.getIPs(value[i]);
      }
    }
  }
}
