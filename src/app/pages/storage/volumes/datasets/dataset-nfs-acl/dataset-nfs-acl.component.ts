import {
  Component,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { DefaultAclType } from 'app/enums/acl-type.enum';
import { PosixAclTag } from 'app/enums/posix-acl.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { NfsAclItem } from 'app/interfaces/acl.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import {
  FieldConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, StorageService, DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { UserService } from 'app/services/user.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-dataset-acl',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [EntityFormService],
})
export class DatasetNfsAclComponent implements FormConfiguration {
  queryCall: 'filesystem.getacl' = 'filesystem.getacl';
  updateCall: 'filesystem.setacl' = 'filesystem.setacl';
  isEntity = true;
  pk: string;
  protected path: string;
  protected datasetId: string;
  private aclIsTrivial = false;
  protected userOptions: any[];
  protected groupOptions: any[];
  protected userSearchOptions: [];
  protected groupSearchOptions: [];
  protected defaults: Option[] = [];
  protected recursive: any;
  private aces: any;
  private aces_fc: FieldConfig;
  private entityForm: EntityFormComponent;
  formGroup: FormGroup;
  data: Record<string, unknown> = {};
  error: string;
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  route_success: string[] = ['storage'];
  save_button_enabled = true;
  private homeShare: boolean;
  private isTrivialMessageSent = false;

  protected uid_fc: FieldConfig;
  protected gid_fc: FieldConfig;

  fieldSetDisplay = 'default'; // default | carousel | stepper
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.dataset_acl_title_file,
      class: 'dataset-acl-editor',
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'path',
          class: 'hello-mom',
          placeholder: helptext.dataset_acl_path_placeholder,
          readonly: true,
        },
        {
          type: 'combobox',
          name: 'uid',
          width: '100%',
          placeholder: helptext.dataset_acl_uid_placeholder,
          tooltip: helptext.dataset_acl_uid_tooltip,
          updateLocal: true,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
          loadMoreOptions: this.loadMoreOptions,
        },
        {
          type: 'checkbox',
          name: 'apply_user',
          placeholder: helptext.apply_user.placeholder,
          tooltip: helptext.apply_user.tooltip,
          value: false,
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
          loadMoreOptions: this.loadMoreGroupOptions,
        },
        {
          type: 'checkbox',
          name: 'apply_group',
          placeholder: helptext.apply_group.placeholder,
          tooltip: helptext.apply_group.tooltip,
          value: false,
        },
      ],
    },
    {
      name: helptext.dataset_acl_title_list,
      label: true,
      width: '50%',
      config: [
        {
          type: 'list',
          name: 'aces',
          width: '100%',
          deleteButtonOnFirst: true,
          addBtnMessage: helptext.dataset_acl_add_item_btn,
          placeholder: helptext.dataset_acl_aces_placeholder,
          templateListField: [
            {
              type: 'select',
              name: 'tag',
              placeholder: helptext.dataset_acl_tag_placeholder,
              options: helptext.dataset_acl_tag_options,
              tooltip: helptext.dataset_acl_tag_tooltip,
              required: true,
            },
            {
              type: 'combobox',
              name: 'user',
              placeholder: helptext.dataset_acl_user_placeholder,
              tooltip: helptext.dataset_acl_user_tooltip,
              updateLocal: true,
              options: [],
              searchOptions: [],
              updater: this.updateUserSearchOptions,
              loadMoreOptions: this.loadMoreOptions,
              isHidden: true,
              required: true,
            },
            {
              type: 'combobox',
              name: 'group',
              placeholder: helptext.dataset_acl_group_placeholder,
              tooltip: helptext.dataset_acl_group_tooltip,
              updateLocal: true,
              options: [],
              searchOptions: [],
              updater: this.updateGroupSearchOptions,
              loadMoreOptions: this.loadMoreGroupOptions,
              isHidden: true,
              required: true,
            },
            {
              type: 'select',
              name: 'type',
              placeholder: helptext.dataset_acl_type_placeholder,
              tooltip: helptext.dataset_acl_type_tooltip,
              options: helptext.dataset_acl_type_options,
              required: true,
              value: 'ALLOW',
            },
            {
              type: 'select',
              name: 'perms_type',
              required: true,
              placeholder: helptext.dataset_acl_perms_type_placeholder,
              tooltip: helptext.dataset_acl_perms_type_tooltip,
              options: helptext.dataset_acl_perms_type_options,
              value: 'BASIC',
            },
            {
              type: 'select',
              name: 'basic_perms',
              required: true,
              placeholder: helptext.dataset_acl_perms_placeholder,
              tooltip: helptext.dataset_acl_perms_tooltip,
              options: helptext.dataset_acl_basic_perms_options,
              value: 'MODIFY',
            },
            {
              type: 'select',
              multiple: true,
              isHidden: true,
              required: true,
              name: 'advanced_perms',
              placeholder: helptext.dataset_acl_perms_placeholder,
              tooltip: helptext.dataset_acl_perms_tooltip,
              options: helptext.dataset_acl_advanced_perms_options,
            },
            {
              type: 'select',
              name: 'flags_type',
              required: true,
              placeholder: helptext.dataset_acl_flags_type_placeholder,
              tooltip: helptext.dataset_acl_flags_type_tooltip,
              options: helptext.dataset_acl_flags_type_options,
              value: 'BASIC',
            },
            {
              type: 'select',
              name: 'basic_flags',
              placeholder: helptext.dataset_acl_flags_placeholder,
              tooltip: helptext.dataset_acl_flags_tooltip,
              options: helptext.dataset_acl_basic_flags_options,
              value: 'INHERIT',
            },
            {
              type: 'select',
              multiple: true,
              isHidden: true,
              required: true,
              name: 'advanced_flags',
              placeholder: helptext.dataset_acl_flags_placeholder,
              tooltip: helptext.dataset_acl_flags_tooltip,
              options: helptext.dataset_acl_advanced_flags_options,
            },
          ],
          listFields: [],
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
    {
      name: helptext.dataset_acl_title_advanced,
      label: true,
      width: '100%',
      config: [
        {
          type: 'checkbox',
          name: 'recursive',
          placeholder: helptext.dataset_acl_recursive_placeholder,
          tooltip: helptext.dataset_acl_recursive_tooltip,
          value: false,
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
            action: RelationAction.Hide,
            when: [{
              name: 'recursive',
              value: false,
            }],
          }],
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  custActions = [
    {
      id: 'use_perm_editor',
      name: helptext.permissions_editor_button,
      function: () => {
        this.router.navigate(new Array('/').concat([
          'storage', 'permissions', this.datasetId,
        ]));
      },
    },
    {
      id: 'strip_acl',
      name: helptext.dataset_acl_stripacl_placeholder,
      function: () => {
        this.doStripACL();
      },
    },
    {
      id: 'show_defaults',
      name: helptext.preset_cust_action_btn,
      function: () => {
        this.showChoiceDialog(true);
      },
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected userService: UserService,
    protected storageService: StorageService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected dialog: MatDialog,
    private translate: TranslateService,
    private entityFormService: EntityFormService,
  ) {}

  isCustActionVisible(actionId: string): boolean {
    if (actionId === 'show_defaults') {
      return true;
    }
    if (this.aclIsTrivial) {
      return actionId === 'use_perm_editor';
    }
    return actionId === 'strip_acl';
  }

  preInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('homeShare')) {
      this.homeShare = true;
    }
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.datasetId = params['path'];
      this.path = '/mnt/' + params['path'];
      const path_fc = _.find(this.fieldSets[0].config, { name: 'path' });
      path_fc.value = this.path;
      this.route.queryParams.pipe(untilDestroyed(this)).subscribe((qparams) => {
        if (qparams && qparams.default) {
          this.pk = qparams.default;
        } else {
          this.pk = this.path;
        }
      });
    });

    this.userService.userQueryDSCache().pipe(untilDestroyed(this)).subscribe((items: any) => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      this.userOptions = users;

      this.uid_fc = _.find(this.fieldConfig, { name: 'uid' });
      this.uid_fc.options = this.userOptions;
    });

    this.userService.groupQueryDSCache().pipe(untilDestroyed(this)).subscribe((groups: any) => {
      const groupOptions: Option[] = [];
      for (let i = 0; i < groups.length; i++) {
        groupOptions.push({ label: groups[i].group, value: groups[i].group });
      }
      this.groupOptions = groupOptions;

      this.gid_fc = _.find(this.fieldConfig, { name: 'gid' });
      this.gid_fc.options = this.groupOptions;
    });
    this.ws.call('filesystem.default_acl_choices').pipe(untilDestroyed(this)).subscribe((res: any[]) => {
      res.forEach((item) => {
        if (item !== 'POSIX_OPEN' && item !== 'POSIX_RESTRICTED') {
          this.defaults.push({ label: item, value: item });
        }
      });
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.entityForm.formGroup.get('path').setValue(this.path);
    this.recursive = entityEdit.formGroup.controls['recursive'];
    this.recursive.valueChanges.pipe(untilDestroyed(this)).subscribe((value: boolean) => {
      if (value === true) {
        this.dialogService.confirm(helptext.dataset_acl_recursive_dialog_warning,
          helptext.dataset_acl_recursive_dialog_warning_message)
          .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
            if (!res) {
              this.recursive.setValue(false);
            }
          });
      }
    });

    this.ws.call('filesystem.acl_is_trivial', [this.path]).pipe(untilDestroyed(this)).subscribe((aclIsTrivial: any) => {
      this.aclIsTrivial = aclIsTrivial;
    }, (err: any) => {
      new EntityUtils().handleWSError(this.entityForm, err);
    });

    this.aces_fc = _.find(this.fieldConfig, { name: 'aces' });
    this.aces = this.entityForm.formGroup.controls['aces'];
    this.aces.valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
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
            user_fc = _.find(controls, { name: 'user' });
            group_fc = _.find(controls, { name: 'group' });
            if (user_fc.options === undefined || user_fc.options.length === 0) {
              user_fc.options = this.userOptions;
            }
            if (!user_fc['parent']) {
              user_fc.parent = this;
            }
            if (group_fc.options === undefined || group_fc.options.length === 0) {
              group_fc.options = this.groupOptions;
            }
            if (!group_fc['parent']) {
              group_fc.parent = this;
            }
            if (res[i].tag === PosixAclTag.User) {
              this.setDisabled(user_fc, this.aces.controls[i].controls['user'], false, false);
              this.setDisabled(group_fc, this.aces.controls[i].controls['group'], true, true);
            } else if (res[i].tag === PosixAclTag.Group) {
              this.setDisabled(user_fc, this.aces.controls[i].controls['user'], true, true);
              this.setDisabled(group_fc, this.aces.controls[i].controls['group'], false, false);
            } else {
              this.setDisabled(user_fc, this.aces.controls[i].controls['user'], true, true);
              this.setDisabled(group_fc, this.aces.controls[i].controls['group'], true, true);
            }
            adv_perms_fc = _.find(controls, { name: 'advanced_perms' });
            basic_perms_fc = _.find(controls, { name: 'basic_perms' });
            if (res[i].perms_type === 'ADVANCED') {
              adv_perms_fc.isHidden = false;
              adv_perms_fc.required = true;
              basic_perms_fc.isHidden = true;
              basic_perms_fc.required = false;
            } else {
              adv_perms_fc.isHidden = true;
              adv_perms_fc.required = false;
              basic_perms_fc.isHidden = false;
              basic_perms_fc.required = true;
              if (res[i].basic_perms === 'OTHER') {
                basic_perms_fc.warnings = helptext.dataset_acl_basic_perms_other_warning;
                canSave = false;
              } else {
                basic_perms_fc.warnings = null;
              }
            }
            adv_flags_fc = _.find(controls, { name: 'advanced_flags' });
            basic_flags_fc = _.find(controls, { name: 'basic_flags' });
            if (res[i].flags_type === 'ADVANCED') {
              adv_flags_fc.isHidden = false;
              adv_flags_fc.required = true;
              basic_flags_fc.isHidden = true;
              basic_flags_fc.required = false;
            } else {
              adv_flags_fc.isHidden = true;
              adv_flags_fc.required = false;
              basic_flags_fc.isHidden = false;
              basic_flags_fc.required = true;
            }
          }
        }
      }
      this.save_button_enabled = canSave;
    });
  }

  chooseDefaultSetting(value: string): void {
    const num = value === 'RESTRICTED' ? 2 : 3;
    while (this.aces.controls.length > num) {
      this.aces.removeAt(num);
    }
    this.ws.call('filesystem.get_default_acl', [value as DefaultAclType]).pipe(untilDestroyed(this)).subscribe((res) => {
      this.dataHandler(this.entityForm, res);
    });
  }

  setDisabled(fieldConfig: FieldConfig, formControl: FormControl, disable: boolean, hide: boolean): void {
    fieldConfig.disabled = disable;
    fieldConfig['isHidden'] = hide;
    if (formControl && formControl.disabled !== disable) {
      const method = disable ? 'disable' : 'enable';
      formControl[method]();
    }
  }

  // TODO: Refactor for better readability
  resourceTransformIncomingRestData(data: any): any {
    let returnLater = false;
    if (data.acl.length === 0) {
      setTimeout(() => {
        this.handleEmptyACL();
      }, 1000);
      return { aces: [] as any };
    }
    if (this.homeShare) {
      returnLater = true;
      this.ws.call('filesystem.get_default_acl', [DefaultAclType.Home]).pipe(untilDestroyed(this)).subscribe((res) => {
        data.acl = res;
        return { aces: data.acl as any };
      });
    }
    if (!returnLater) {
      return { aces: data.acl as any };
    }
  }

  handleEmptyACL(): void {
    this.loader.close();
    this.dialogService.errorReport(helptext.empty_acl_dialog.title, helptext.empty_acl_dialog.message)
      .pipe(untilDestroyed(this)).subscribe(() => {
        this.router.navigate(new Array('/').concat(this.route_success));
      });
  }

  async dataHandler(entityForm: EntityFormComponent, defaults?: NfsAclItem[]): Promise<void> {
    entityForm.formGroup.controls['aces'].reset();
    (entityForm.formGroup.controls['aces'] as FormArray).controls = [];
    this.aces_fc.listFields = [];
    this.gid_fc = _.find(this.fieldConfig, { name: 'gid' });
    this.uid_fc = _.find(this.fieldConfig, { name: 'uid' });

    this.loader.open();
    const res = entityForm.queryResponse;
    if (defaults) {
      res.acl = defaults;
    }
    const user: any = await this.userService.getUserObject(res.uid);
    if (user && user.pw_name) {
      entityForm.formGroup.controls['uid'].setValue(user.pw_name);
    } else {
      entityForm.formGroup.controls['uid'].setValue(res.uid);
      this.uid_fc.warnings = helptext.user_not_found;
    }
    const group: any = await this.userService.getGroupObject(res.gid);
    if (group && group.gr_name) {
      entityForm.formGroup.controls['gid'].setValue(group.gr_name);
    } else {
      entityForm.formGroup.controls['gid'].setValue(res.gid);
      this.gid_fc.warnings = helptext.group_not_found;
    }
    let data = res.acl;
    let acl: any;
    if (!data.length) {
      data = [data];
    }

    for (let i = 0; i < data.length; i++) {
      acl = {};
      acl.type = data[i].type;
      acl.tag = data[i].tag;
      if (acl.tag === PosixAclTag.User) {
        const usr: any = await this.userService.getUserObject(data[i].id);
        if (usr && usr.pw_name) {
          acl.user = usr.pw_name;
        } else {
          acl.user = data[i].id;
          acl['user_not_found'] = true;
        }
      } else if (acl.tag === PosixAclTag.Group) {
        const grp: any = await this.userService.getGroupObject(data[i].id);
        if (grp && grp.gr_name) {
          acl.group = grp.gr_name;
        } else {
          acl.group = data[i].id;
          acl['group_not_found'] = true;
        }
      }
      if (data[i].flags['BASIC']) {
        acl.flags_type = 'BASIC';
        acl.basic_flags = data[i].flags['BASIC'];
      } else {
        acl.flags_type = 'ADVANCED';
        const flags = data[i].flags;
        acl.advanced_flags = [];
        for (const flag in flags) {
          if (flags.hasOwnProperty(flag) && flags[flag]) {
            acl.advanced_flags.push(flag);
          }
        }
      }
      if (data[i].perms['BASIC']) {
        acl.perms_type = 'BASIC';
        acl.basic_perms = data[i].perms['BASIC'];
      } else {
        acl.perms_type = 'ADVANCED';
        const perms = data[i].perms;
        acl.advanced_perms = [];
        for (const perm in perms) {
          if (perms.hasOwnProperty(perm) && perms[perm]) {
            acl.advanced_perms.push(perm);
          }
        }
      }
      const propName = 'aces';
      const aces_fg = entityForm.formGroup.get(propName) as FormArray;
      if (!aces_fg.controls[i]) {
        // add controls;
        const templateListField = _.cloneDeep(_.find(this.fieldConfig, { name: propName }).templateListField);
        const formGroup = this.entityFormService.createFormGroup(templateListField);
        aces_fg.push(formGroup);
        this.aces_fc.listFields.push(templateListField);
      }

      for (const prop in acl) {
        if (acl.hasOwnProperty(prop)) {
          if (prop === 'basic_perms' && acl[prop] === 'OTHER') {
            _.find(
              _.find(
                this.aces_fc.listFields[i], { name: prop },
              )['options'], { value: 'OTHER' },
            )['hiddenFromDisplay'] = false;
          }
          if (prop === 'user' && acl['user_not_found']) {
            delete (acl['user_not_found']);
            _.find(this.aces_fc.listFields[i], { name: prop })['warnings'] = helptext.user_not_found;
          }
          if (prop === 'group' && acl['group_not_found']) {
            delete (acl['group_not_found']);
            _.find(this.aces_fc.listFields[i], { name: prop })['warnings'] = helptext.group_not_found;
          }
          (aces_fg.controls[i] as FormGroup).controls[prop].setValue(acl[prop]);
        }
      }
    }
    this.loader.close();
    this.dialogService.closeAllDialogs();
    if (this.aclIsTrivial && !this.isTrivialMessageSent && !this.homeShare) {
      this.showChoiceDialog();
    }
  }

  showChoiceDialog(presetsOnly = false): void {
    const msg1 = this.translate.instant(helptext.type_dialog.radio_preset_tooltip);
    const msg2 = this.translate.instant(helptext.preset_dialog.message);
    const conf: DialogFormConfiguration = {
      title: presetsOnly ? helptext.type_dialog.radio_preset : helptext.type_dialog.title,
      message: presetsOnly ? `${msg1} ${msg2}` : null,
      fieldConfig: [
        {
          type: 'radio',
          name: 'useDefault',
          options: [
            {
              label: helptext.type_dialog.radio_preset,
              name: 'defaultACL',
              tooltip: helptext.type_dialog.radio_preset_tooltip,
              value: true,
            },
            {
              label: helptext.type_dialog.radio_custom,
              name: 'customACL',
              value: false,
            },
          ],
          value: true,
          isHidden: presetsOnly,
        },
        {
          type: 'select',
          name: 'defaultOptions',
          placeholder: helptext.type_dialog.input.placeholder,
          options: this.defaults,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'useDefault',
                value: true,
              }],
            },
          ],
          required: true,
        },
      ],
      saveButtonText: helptext.type_dialog.button,
      parent: this,
      hideCancel: !presetsOnly,
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close();
        const { useDefault, defaultOptions } = entityDialog.formValue;
        if (useDefault && defaultOptions) {
          this.chooseDefaultSetting(defaultOptions);
        }
        this.isTrivialMessageSent = true;
      },
    };
    this.dialogService.dialogForm(conf);
  }

  beforeSubmit(data: any): void {
    const dacl = [];
    for (let i = 0; i < data.aces.length; i++) {
      const d: any = {};
      const acl = data.aces[i];
      d['tag'] = acl.tag;
      d['id'] = null;
      if (acl.tag === PosixAclTag.User) {
        d['id'] = acl.user;
      } else if (acl.tag === PosixAclTag.Group) {
        d['id'] = acl.group;
      }
      d['type'] = acl.type;
      if (acl.perms_type === 'BASIC') {
        d['perms'] = { BASIC: acl.basic_perms };
      } else {
        d['perms'] = {};
        const adv_perm_options = helptext.dataset_acl_advanced_perms_options;
        for (let j = 0; j < adv_perm_options.length; j++) {
          const perm = adv_perm_options[j].value;
          if (_.indexOf(acl.advanced_perms, perm) > -1) {
            d['perms'][perm] = true;
          }
        }
      }
      if (acl.flags_type === 'BASIC') {
        d['flags'] = { BASIC: acl.basic_flags };
      } else {
        d['flags'] = {};
        const adv_flag_options = helptext.dataset_acl_advanced_flags_options;
        for (let j = 0; j < adv_flag_options.length; j++) {
          const flag = adv_flag_options[j].value;
          if (_.indexOf(acl.advanced_flags, flag) > -1) {
            d['flags'][flag] = true;
          }
        }
      }
      dacl.push(d);
    }
    data['dacl'] = dacl;
  }

  async customSubmit(body: any): Promise<void> {
    body.uid = body.apply_user ? body.uid : null;
    body.gid = body.apply_group ? body.gid : null;

    const doesNotWantToEditDataset = this.storageService.isDatasetTopLevel(this.path.replace('mnt/', ''))
      && !(await this.dialogService.confirm({
        title: helptext.dataset_acl_dialog_warning,
        message: helptext.dataset_acl_toplevel_dialog_message,
      }).toPromise());

    if (doesNotWantToEditDataset) {
      return;
    }

    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: helptext.save_dialog.title } });
    this.dialogRef.componentInstance.setDescription(helptext.save_dialog.message);
    const dacl = body.dacl;

    await this.userService.getUserByName(body.uid).toPromise().then((userObj: any) => {
      if (userObj && userObj.hasOwnProperty('pw_uid')) {
        body.uid = userObj.pw_uid;
      }
    }, (err: any) => {
      console.error(err);
    });

    await this.userService.getGroupByName(body.gid).toPromise().then((groupObj: any) => {
      if (groupObj && groupObj.hasOwnProperty('gr_gid')) {
        body.gid = groupObj.gr_gid;
      }
    }, (err: any) => {
      console.error(err);
    });

    for (let i = 0; i < dacl.length; i++) {
      if (dacl[i].tag === PosixAclTag.User) {
        await this.userService.getUserByName(dacl[i].id).toPromise().then((userObj: any) => {
          if (userObj && userObj.hasOwnProperty('pw_uid')) {
            dacl[i]['id'] = userObj.pw_uid;
          }
        }, (err: any) => {
          console.error(err);
        });
      } else if (dacl[i].tag === PosixAclTag.Group) {
        await this.userService.getGroupByName(dacl[i].id).toPromise().then((groupObj: any) => {
          if (groupObj && groupObj.hasOwnProperty('gr_gid')) {
            dacl[i]['id'] = groupObj.gr_gid;
          }
        }, (err: any) => {
          console.error(err);
        });
      }
    }
    this.dialogRef.componentInstance.setCall(this.updateCall,
      [{
        path: this.path,
        dacl,
        uid: body.uid,
        gid: body.gid,
        options: {
          recursive: body.recursive,
          traverse: body.traverse,
        },
      }]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityForm.success = true;
      this.dialogRef.close();
      this.router.navigate(new Array('/').concat(
        this.route_success,
      ));
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
    });
  }

  updateGroupSearchOptions(value = '', parent: any, config: any): void {
    (parent.userService as UserService).groupQueryDSCache(value).pipe(untilDestroyed(this)).subscribe((groups: any) => {
      const groupOptions = [];
      for (let i = 0; i < groups.length; i++) {
        groupOptions.push({ label: groups[i].group, value: groups[i].group });
      }
      config.searchOptions = groupOptions;
    });
  }

  updateUserSearchOptions(value = '', parent: any, config: any): void {
    (parent.userService as UserService).userQueryDSCache(value).pipe(untilDestroyed(this)).subscribe((items: any) => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      config.searchOptions = users;
    });
  }

  doStripACL(): void {
    const conf: DialogFormConfiguration = {
      title: helptext.stripACL_dialog.title,
      message: helptext.stripACL_dialog.message,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'traverse',
          placeholder: helptext.stripACL_dialog.traverse_checkbox,
        },
      ],
      // warning:helptext.stripACL_dialog.warning,
      saveButtonText: helptext.dataset_acl_stripacl_placeholder,
      parent: this,
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close();

        this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Stripping ACLs') } });
        this.dialogRef.componentInstance.setDescription(T('Stripping ACLs...'));

        this.dialogRef.componentInstance.setCall(this.updateCall,
          [{
            path: this.path,
            dacl: [],
            options: {
              recursive: true,
              traverse: !!entityDialog.formValue.traverse,
              stripacl: true,
            },
          }]);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.entityForm.success = true;
          this.dialogRef.close();
          this.router.navigate(new Array('/').concat(
            this.route_success,
          ));
        });
        this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err: any) => {
          new EntityUtils().handleWSError(this.entityForm, err);
        });
      },
    };
    this.dialogService.dialogFormWide(conf);
  }

  loadMoreOptions(length: number, parent: any, searchText: string, config: any): void {
    (parent.userService as UserService).userQueryDSCache(searchText, length)
      .pipe(untilDestroyed(this))
      .subscribe((items: any) => {
        const users: Option[] = [];
        for (let i = 0; i < items.length; i++) {
          users.push({ label: items[i].username, value: items[i].username });
        }
        if (searchText == '') {
          config.options = config.options.concat(users);
        } else {
          config.searchOptions = config.searchOptions.concat(users);
        }
      });
  }

  loadMoreGroupOptions(length: number, parent: any, searchText: string, config: any): void {
    parent.userService.groupQueryDSCache(searchText, false, length)
      .pipe(untilDestroyed(this))
      .subscribe((items: Group[]) => {
        const groups: Option[] = [];
        for (let i = 0; i < items.length; i++) {
          groups.push({ label: items[i].group, value: items[i].group });
        }
        if (searchText == '') {
          config.options = config.options.concat(groups);
        } else {
          config.searchOptions = config.searchOptions.concat(groups);
        }
      });
  }
}
