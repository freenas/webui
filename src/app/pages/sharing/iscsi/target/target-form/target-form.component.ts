import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { IscsiService, WebSocketService } from '../../../../../services/';
import { EntityUtils } from '../../../../common/entity/utils';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { T } from '../../../../../translate-marker';
import { TranslateService } from '@ngx-translate/core';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

@Component({
  selector : 'app-iscsi-target-form',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ IscsiService, EntityFormService ],
})
export class TargetFormComponent {

  protected queryCall= 'iscsi.target.query';
  protected addCall = 'iscsi.target.create';
  protected editCall = 'iscsi.target.update';
  public route_success: string[] = [ 'sharing', 'iscsi', 'target' ];
  protected customFilter: Array<any> = [[["id", "="]]];
  protected isEntity: boolean = true;

  protected initialCount: number = 1;
  protected initialCount_default: number = 0;
  public arrayControl: any;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name : 'name',
      placeholder : helptext_sharing_iscsi.target_form_placeholder_name,
      tooltip: helptext_sharing_iscsi.target_form_tooltip_name,
      required: true,
      validation: helptext_sharing_iscsi.target_form_validators_name,
    },
    {
      type: 'input',
      name : 'alias',
      placeholder : helptext_sharing_iscsi.target_form_placeholder_alias,
      tooltip: helptext_sharing_iscsi.target_form_tooltip_alias,
    },
    {
      type: 'array',
      name : "groups",
      initialCount : 1,
      formarray : [
          {
            type: 'select',
            name : 'portal',
            placeholder : helptext_sharing_iscsi.target_form_placeholder_portal,
            tooltip: helptext_sharing_iscsi.target_form_tooltip_portal,
            value : '',
            options: [],
            required: true,
            validation: helptext_sharing_iscsi.target_form_validators_portal,
          },
          {
            type: 'select',
            name : 'initiator',
            placeholder : helptext_sharing_iscsi.target_form_placeholder_initiator,
            tooltip: helptext_sharing_iscsi.target_form_tooltip_initiator,
            value : null,
            options: [],
          },
          {
            type: 'select',
            name : 'authmethod',
            placeholder : helptext_sharing_iscsi.target_form_placeholder_authmethod,
            tooltip: helptext_sharing_iscsi.target_form_tooltip_authmethod,
            value : 'NONE',
            options : [
              {
                label : 'None',
                value : 'NONE',
              },
              {
                label : 'CHAP',
                value : 'CHAP',
              },
              {
                label : 'Mutual CHAP',
                value : 'CHAP_MUTUAL',
              }
            ],
          },
          {
            type: 'select',
            name : 'auth',
            placeholder : helptext_sharing_iscsi.target_form_placeholder_auth,
            tooltip: helptext_sharing_iscsi.target_form_tooltip_auth,
            value : null,
            options: [],
          },
          {
            type: 'checkbox',
            name: 'delete',
            placeholder: helptext_sharing_iscsi.target_form_placeholder_delete,
            isHidden: true,
            disabled: true,
          }
        ]
    }
  ];

  public custActions: Array<any> = [
    {
      id : 'add_extra_iscsi_group',
      name : 'Add Extra ISCSI Group',
      function : () => {
        this.initialCount += 1;
        this.entityFormService.insertFormArrayGroup(this.initialCount, this.formArray, this.arrayControl.formarray);
      }
    },
    {
      id : 'remove_extra_iscsi_group',
      name : 'Remove Extra ISCSI Group',
      function : () => {
        this.initialCount -= 1;
        this.entityFormService.removeFormArrayGroup(this.initialCount, this.formArray);
      }
    },
  ];

  protected portals: any;
  protected initiators: any;
  protected auths: any;
  protected formArray: any;
  private pk: any;
  protected entityForm: any;
  constructor(protected router: Router,
              protected aroute: ActivatedRoute,
              protected iscsiService: IscsiService,
              protected entityFormService: EntityFormService,
              protected loader: AppLoaderService,
              public translate: TranslateService,
              protected ws: WebSocketService) {}

  preInit() {
    this.arrayControl = _.find(this.fieldConfig,{'name' : 'groups'});

    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
        this.initialCount = 0;
        this.arrayControl.initialCount = 0;
        this.arrayControl.formarray[4].isHidden = false;
        this.arrayControl.formarray[4].disabled = false;
      }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.formArray = entityForm.formGroup.controls['groups'];

    this.iscsiService.listPortals().subscribe((res) => {
      this.portals = res.data;
      this.setFormArray(this.arrayControl.formarray[0]);
    });
    this.iscsiService.listInitiators().subscribe((res) => {
      this.initiators = res.data;
      this.setFormArray(this.arrayControl.formarray[1]);
    });
    this.iscsiService.listAuthCredential().subscribe((res) => {
      this.auths = res.data;
      this.setFormArray(this.arrayControl.formarray[3]);
    });
  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_extra_iscsi_group' && this.initialCount <= 1) {
      return false;
    }
    return true;
  }

  setFormArray(groupModel: any) {
    if(groupModel.name == 'portal') {
      groupModel.options.push({label : 'None', value : ''});
      this.portals.forEach((item, i) => {
        var label = item.iscsi_target_portal_tag;
        if (item.iscsi_target_portal_comment) {
          label = item.iscsi_target_portal_tag + ' (' + item.iscsi_target_portal_comment + ')';
        }
        groupModel.options.push({label : label, value : i + 1})
      });
    } else if (groupModel.name == 'initiator') {
      groupModel.options.push({label : 'None', value : null});
      this.initiators.forEach((item, i) => {
        var label = item.iscsi_target_initiator_tag;
        if (item.iscsi_target_initiator_comment) {
          label = item.iscsi_target_initiator_tag + ' (' + item.iscsi_target_initiator_comment + ')';
        }
        groupModel.options.push({label : label, value : i + 1})
      });
    } else if (groupModel.name == 'auth') {
      groupModel.options.push({label : 'None', value : null});
      this.auths.forEach((item) => {
        groupModel.options.push(
          {
            label : item.iscsi_target_auth_tag,
            value : item.iscsi_target_auth_tag
          }
        )
      });
    }
  }

  getGroups(data: any[]): any[] {
    var groups = new Array();
    for (let i in data) {
      if (!data[i]['delete']) {
        groups.push(data[i]);
      }
    }
    return groups;
  }

  beforeSubmit(value: any) {
    for (let i in value) {
      if (Array.isArray(value[i])) {
        value[i] = this.getGroups(value[i]);
      }
    }
  }

  customEditCall(value) {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      }
    );

  }
}
