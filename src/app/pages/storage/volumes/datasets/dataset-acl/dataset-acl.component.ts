import {
  Component,
  OnDestroy,
} from '@angular/core';
import {
  FormGroup,
} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import { UserService } from '../../../../../services/user.service';
import {RestService, WebSocketService, StorageService, DialogService} from '../../../../../services/';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { T } from '../../../../../translate-marker';
import helptext from '../../../../../helptext/storage/volumes/datasets/dataset-acl';
import { MatDialog } from '@angular/material';
import { EntityJobComponent } from '../../../../common/entity/entity-job/entity-job.component';
import {EntityUtils} from '../../../../common/entity/utils';


@Component({
  selector : 'app-dataset-acl',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetAclComponent implements OnDestroy {

  protected queryCall = 'filesystem.getacl';
  protected updateCall = 'filesystem.setacl';
  protected isEntity = true;
  protected pk: string;
  protected path: string;
  protected userOptions: any[];
  protected groupOptions: any[];
  protected userSearchOptions: [];
  protected groupSearchOptions: [];
  protected recursive: any;
  protected recursive_subscription: any;
  protected stripacl: any;
  protected stripacl_subscription: any;
  private aces: any;
  private aces_fc: any;
  private aces_subscription: any;
  private entityForm: any;
  private acl: any;
  public sub: Subscription;
  public formGroup: FormGroup;
  public data: Object = {};
  public error: string;
  public busy: Subscription;
  protected fs: any = (<any>window).filesize;
  protected dialogRef: any
  protected route_success: string[] = [ 'storage', 'pools' ];
  public save_button_enabled = true;

  public fieldSetDisplay  = 'default';//default | carousel | stepper
  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [{
    name: helptext.dataset_acl_title_name,
    class: "dataset-acl-editor",
    label: true,
    config:[
    {
      type: 'input',
      name : 'path',
      placeholder : helptext.dataset_acl_path_placeholder,
      readonly: true
    },
    {
      type: 'combobox',
      name: 'uid',
      placeholder: helptext.dataset_acl_uid_placeholder,
      tooltip: helptext.dataset_acl_uid_tooltip,
      updateLocal: true,
      options: [],
      searchOptions: [],
      parent: this,
      updater: this.updateUserSearchOptions,
    },
    {
      type: 'combobox',
      name: 'gid',
      placeholder: helptext.dataset_acl_gid_placeholder,
      tooltip: helptext.dataset_acl_gid_tooltip,
      updateLocal: true,
      options: [],
      searchOptions: [],
      parent: this,
      updater: this.updateGroupSearchOptions,
    },
    {
      type: 'list',
      name: 'aces',
      width: '100%',
      placeholder: helptext.dataset_acl_aces_placeholder,
      templateListField: [
        {
          type: 'select',
          name: 'tag',
          placeholder: helptext.dataset_acl_tag_placeholder,
          options: helptext.dataset_acl_tag_options,
          tooltip: helptext.dataset_acl_tag_tooltip,
        },
        {
          type: 'combobox',
          name: 'user',
          placeholder: helptext.dataset_acl_user_placeholder,
          tooltip: helptext.dataset_acl_user_tooltip,
          updateLocal: true,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
          isHidden: true,
        },
        {
          type: 'combobox',
          name: 'group',
          placeholder: helptext.dataset_acl_group_placeholder,
          tooltip: helptext.dataset_acl_group_tooltip,
          updateLocal: true,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateGroupSearchOptions,
          isHidden: true,
        },
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.dataset_acl_type_placeholder,
          tooltip: helptext.dataset_acl_type_tooltip,
          options: helptext.dataset_acl_type_options,
        },
        {
          type: 'select',
          name: 'perms_type',
          placeholder: helptext.dataset_acl_perms_type_placeholder,
          tooltip: helptext.dataset_acl_perms_type_placeholder,
          options: helptext.dataset_acl_perms_type_options,
        },
        {
          type: 'select',
          name: 'basic_perms',
          placeholder: helptext.dataset_acl_perms_placeholder,
          tooltip: helptext.dataset_acl_perms_tooltip,
          options: helptext.dataset_acl_basic_perms_options,
        },
        {
          type: 'select',
          multiple: true,
          isHidden: true,
          name: 'advanced_perms',
          placeholder: helptext.dataset_acl_perms_placeholder,
          tooltip: helptext.dataset_acl_perms_tooltip,
          options: helptext.dataset_acl_advanced_perms_options,
        },
        {
          type: 'select',
          name: 'flags_type',
          placeholder: helptext.dataset_acl_flags_type_placeholder,
          tooltip: helptext.dataset_acl_flags_type_placeholder,
          options: helptext.dataset_acl_flags_type_options,
        },
        {
          type: 'select',
          name: 'basic_flags',
          placeholder: helptext.dataset_acl_flags_placeholder,
          tooltip: helptext.dataset_acl_flags_tooltip,
          options: helptext.dataset_acl_basic_flags_options,
        },
        {
          type: 'select',
          multiple: true,
          isHidden: true,
          name: 'advanced_flags',
          placeholder: helptext.dataset_acl_flags_placeholder,
          tooltip: helptext.dataset_acl_flags_tooltip,
          options: helptext.dataset_acl_advanced_flags_options,
        }
      ],
      listFields: []
    },
    {
      type: 'checkbox',
      name: 'recursive',
      placeholder: helptext.dataset_acl_recursive_placeholder,
      tooltip: helptext.dataset_acl_recursive_tooltip,
      value: false
    },
    {
      type: 'checkbox',
      name: 'traverse',
      placeholder: helptext.dataset_acl_traverse_placeholder,
      tooltip: helptext.dataset_acl_traverse_tooltip,
      value: false,
      isHidden: true,
      disabled: true,
      relation: [{
        action: 'HIDE',
        when: [{
          name: 'recursive',
          value: false,
        }]
      }],
    },
    {
      type: 'checkbox',
      name: 'stripacl',
      placeholder: helptext.dataset_acl_stripacl_placeholder,
      tooltip: helptext.dataset_acl_stripacl_tooltip,
      value: false,
    }
  ]}
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected rest: RestService,
              protected ws: WebSocketService, protected userService: UserService,
              protected storageService: StorageService, protected dialogService: DialogService,
              protected loader: AppLoaderService, protected dialog: MatDialog) {}

  preInit(entityEdit: any) {
    this.sub = this.aroute.params.subscribe(params => {
      this.path = '/mnt/' + params['path'];
      const path_fc = _.find(this.fieldSets[0].config, {name:'path'});
      path_fc.value = this.path;
      this.pk = this.path;
    });

    this.userService.userQueryDSCache().subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      this.userOptions = users;

      const uid_fc = _.find(this.fieldConfig, {"name": "uid"});
      uid_fc.options = this.userOptions;
    });

    this.userService.groupQueryDSCache().subscribe(items => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].group, value: items[i].group});
      }
      this.groupOptions = groups;

      const gid_fc = _.find(this.fieldConfig, {"name": "gid"});
      gid_fc.options = this.groupOptions;
    });
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.recursive = entityEdit.formGroup.controls['recursive'];
    this.recursive_subscription = this.recursive.valueChanges.subscribe((value) => {
      if (value === true) {
        this.dialogService.confirm(helptext.dataset_acl_recursive_dialog_warning,
         helptext.dataset_acl_recursive_dialog_warning_message)
        .subscribe((res) => {
          if (!res) {
            this.recursive.setValue(false);
          }
        });
      }
    });
    this.ws.call('filesystem.acl_is_trivial', [this.path]).subscribe(acl_is_trivial => {
      this.entityForm.setDisabled('stripacl', acl_is_trivial);
    }, (err) => {
      new EntityUtils().handleWSError(this.entityForm, err);
    });
    this.stripacl = entityEdit.formGroup.controls['stripacl'];
    this.stripacl_subscription = this.stripacl.valueChanges.subscribe((value) => {
      if (value === true) {
        this.dialogService.confirm(helptext.dataset_acl_stripacl_dialog_warning,
         helptext.dataset_acl_stripacl_dialog_warning_message)
        .subscribe((res) => {
          if (!res) {
            this.stripacl.setValue(false);
          }
        });
      }
    });
    this.aces_fc = _.find(this.fieldConfig, {"name": "aces"});
    this.aces = this.entityForm.formGroup.controls['aces'];
    this.aces_subscription = this.aces.valueChanges.subscribe(res => {
      let controls;
      let user_fc;
      let group_fc;
      let adv_perms_fc;
      let basic_perms_fc;
      let adv_flags_fc;
      let basic_flags_fc;
      const listFields = this.aces_fc.listFields;
      let canSave = true;
      if (listFields && listFields.length > 0 && res.length === listFields.length) {
        for (let i = 0; i < listFields.length; i++) {
          controls = listFields[i];
          if (controls) {
            user_fc = _.find(controls, {"name": "user"});
            group_fc = _.find(controls, {"name": "group"});
            if (user_fc.options === undefined || user_fc.options.length === 0) {
              user_fc.options = this.userOptions;
            }
            if (group_fc.options === undefined || group_fc.options.length === 0) {
              group_fc.options = this.groupOptions;
            }
            if (res[i].tag === 'USER') {
              user_fc.isHidden = false;
              group_fc.isHidden = true;
            } else if (res[i].tag === 'GROUP') {
              user_fc.isHidden = true;
              group_fc.isHidden = false;
            } else {
              user_fc.isHidden = true;
              group_fc.isHidden = true;
            }
            adv_perms_fc = _.find(controls, {"name": "advanced_perms"});
            basic_perms_fc = _.find(controls, {"name": "basic_perms"});
            if (res[i].perms_type === "ADVANCED") {
              adv_perms_fc.isHidden = false;
              basic_perms_fc.isHidden = true;
            } else {
              adv_perms_fc.isHidden = true;
              basic_perms_fc.isHidden = false;
              if (res[i].basic_perms === "OTHER") {
                basic_perms_fc.warnings = helptext.dataset_acl_basic_perms_other_warning;
                canSave = false;
              } else { 
                basic_perms_fc.warnings = null;
              }
            }
            adv_flags_fc = _.find(controls, {"name": "advanced_flags"});
            basic_flags_fc = _.find(controls, {"name": "basic_flags"});
            if (res[i].flags_type === "ADVANCED") {
              adv_flags_fc.isHidden = false;
              basic_flags_fc.isHidden = true;
            } else {
              adv_flags_fc.isHidden = true;
              basic_flags_fc.isHidden = false;
            }
          }
        }
      }
      this.save_button_enabled = canSave;
    });
  }

  resourceTransformIncomingRestData(data) {
    return {"aces": []}; // stupid hacky thing that gets around entityForm's treatment of data
  }

  async dataHandler(entityForm) {
    const res = entityForm.queryResponse;
    await this.userService.getUserByUID(res.uid).toPromise().then(userObj => {
      if (userObj && userObj.length > 0) {
        entityForm.formGroup.controls['uid'].setValue(userObj[0].username);
      }
    }, err => {
      console.error(err);
    });
    await this.userService.getGroupByGID(res.gid).toPromise().then(groupObj => {
      if (groupObj && groupObj.length > 0) {
        entityForm.formGroup.controls['gid'].setValue(groupObj[0].group);
      }
    }, err => {
      console.error(err);
    });
    let data = res.acl;
    let acl;
    if (!data.length) {
      data = [data];
    }
    for (let i = 0; i < data.length; i++) {
      acl = {};
      acl.type = data[i].type;
      acl.tag = data[i].tag;
      if (acl.tag === 'USER') {
        await this.userService.getUserByUID(data[i].id).toPromise().then(userObj => {
          if (userObj && userObj.length > 0) {
            acl.user = userObj[0].username;
          }
        }, err => {
          console.error(err);
        });
      } else if (acl.tag === 'GROUP') {
        await this.userService.getGroupByGID(data[i].id).toPromise().then(groupObj => {
          if (groupObj && groupObj.length > 2) {
            acl.group = groupObj[0].group;
          }
        }, err => {
          console.error(err);
        });
      }
      if (data[i].flags.hasOwnProperty('BASIC')) {
        acl.flags_type = 'BASIC';
        acl.basic_flags = data[i].flags['BASIC'];
      } else {
        acl.flags_type = 'ADVANCED';
        acl.advanced_flags = data[i].flags;
      }
      if (data[i].perms.hasOwnProperty('BASIC')) {
        acl.perms_type = 'BASIC';
        acl.basic_perms = data[i].perms['BASIC'];
      } else {
        acl.flags_perms = 'ADVANCED';
        acl.advanced_perms = data[i].perms;
      }

      const propName = "aces";
      const aces_fg = entityForm.formGroup.controls[propName];
      if (aces_fg.controls[i] === undefined) {
        // add controls;
        const templateListField = _.cloneDeep(_.find(this.fieldConfig, {'name': propName}).templateListField);
        aces_fg.push(entityForm.entityFormService.createFormGroup(templateListField));
        this.aces_fc.listFields.push(templateListField);
      }

      for (const prop in acl) {
        if (acl.hasOwnProperty(prop)) {
          if (prop === "basic_perms" && acl[prop] === "OTHER") {
            _.find(
              _.find(
                this.aces_fc.listFields[i], {"name": prop}
                )['options'], {value: "OTHER"}
              )['hiddenFromDisplay'] = false;
          }
          aces_fg.controls[i].controls[prop].setValue(acl[prop]);
        }
      }
    }
  }

  ngOnDestroy() {
    this.recursive_subscription.unsubscribe();
    this.aces_subscription.unsubscribe();
    this.stripacl_subscription.unsubscribe();
  }

  beforeSubmit(data) {
    const dacl = [];
    for (let i = 0; i < data.aces.length; i++) {
      const d = {};
      const acl = data.aces[i];
      d['tag'] = acl.tag;
      d['id'] = null;
      if (acl.tag === "USER") {
        d['id'] = acl.user;
      } else if (acl.tag === "GROUP") {
        d['id'] = acl.group;
      }
      d['type'] = acl.type;
      if (acl.perms_type === "BASIC") {
        d['perms'] = {'BASIC':acl.basic_perms};
      } else {
        const adv_perm_options = helptext.dataset_acl_advanced_perms_options;
        for (let j = 0; j < adv_perm_options.length; j++) {
          const perm = adv_perm_options[j].value;
          d['perms'][perm] = acl.advanced_perms.hasOwnProperty(perm);
        }
      }
      if (acl.flags_type === "BASIC") {
        d['flags'] = {'BASIC':acl.basic_flags};
      } else {
        const adv_flag_options = helptext.dataset_acl_advanced_flags_options;
        for (let j = 0; j < adv_flag_options.length; j++) {
          const flag = adv_flag_options[j].value;
          d['flags'][flag] = acl.advanced_flags.hasOwnProperty(flag);
        }
      }
      dacl.push(d);
    }
    data['dacl'] = dacl;
  }

  async customSubmit(body) {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Saving ACLs") }});
    this.dialogRef.componentInstance.setDescription(T("Saving ACLs..."));
    let dacl = body.dacl;
    if (body.stripacl) {
      dacl = [];
    }
    await this.userService.getUserByName(body.uid).toPromise().then(userObj => {
      if (userObj && userObj.hasOwnProperty('pw_uid')) {
        body.uid = userObj.pw_uid;
      }
    }, err => {
      console.error(err);
    });

    await this.userService.getGroupByName(body.gid).toPromise().then(groupObj => {
      if (groupObj && groupObj.hasOwnProperty('gr_gid')) {
        body.gid = groupObj.gr_gid;
      }
    }, err => {
      console.error(err);
    });

    for (let i = 0; i < dacl.length; i++) {
      if (dacl[i].tag === 'USER') {
        await this.userService.getUserByName(dacl[i].id).toPromise().then(userObj => {
          if (userObj && userObj.hasOwnProperty('pw_uid')) {
            dacl[i]['id'] = userObj.pw_uid;
          }
        }, err => {
          console.error(err);
        });

      } else if (dacl[i].tag === 'GROUP') {
        await this.userService.getGroupByName(dacl[i].id).toPromise().then(groupObj => {
          if (groupObj && groupObj.hasOwnProperty('gr_gid')) {
            dacl[i]['id'] = groupObj.gr_gid;
          }
        }, err => {
          console.error(err);
        });
      }
    }
    this.dialogRef.componentInstance.setCall(this.updateCall,
      [{'path': body.path, 'dacl': dacl,
        'uid': body.uid, 'gid': body.gid,
        'options' : {'recursive': body.recursive,
         'traverse': body.traverse,
         'stripacl': body.stripacl
        }
      }]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.entityForm.success = true;
      this.dialogRef.close();
      this.router.navigate(new Array('/').concat(
        this.route_success));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
    });
  }

  updateGroupSearchOptions(value = "", parent, config) {
    parent.userService.groupQueryDSCache(value).subscribe(items => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].group, value: items[i].group});
      }
      config.searchOptions = groups;
    });
  }

  updateUserSearchOptions(value = "", parent, config) {
    parent.userService.userQueryDSCache(value).subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      config.searchOptions = users;
    });
  }
}
