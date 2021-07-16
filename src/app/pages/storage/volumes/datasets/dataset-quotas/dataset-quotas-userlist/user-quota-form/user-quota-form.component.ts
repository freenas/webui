import { Component, DoCheck, IterableDiffers } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import {
  DialogService, StorageService, WebSocketService, AppLoaderService, UserService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-user-quota-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class UserQuotaFormComponent implements FormConfiguration, DoCheck {
  isEntity = true;
  entityForm: EntityFormComponent;
  pk: string;
  route_success: string[];
  searchedEntries: any[] = [];
  entryField: FieldConfig;
  isNew = true;
  private dq: string;
  private oq: string;
  private selectedEntriesField: FieldConfig;
  private selectedEntriesValue: any;
  private entryErrs: any;
  private entryErrBool = false;
  save_button_enabled = false;
  private differ: any;
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.users.quota_title,
      label: true,
      width: '48%',
      config: [
        {
          type: 'input',
          name: 'data_quota',
          placeholder: helptext.users.data_quota.placeholder,
          tooltip: `${helptext.users.data_quota.tooltip} bytes.`,
          blurStatus: true,
          blurEvent: this.blurEvent,
          parent: this,
        },
        {
          type: 'input',
          name: 'obj_quota',
          placeholder: helptext.users.obj_quota.placeholder,
          tooltip: helptext.users.obj_quota.tooltip,
        },
      ],
    },
    {
      name: 'vertical_divider',
      label: false,
      width: '2%',
      config: [],
    },
    {
      name: helptext.users.user_title,
      label: true,
      width: '48%',
      config: [
        {
          type: 'select',
          name: 'system_entries',
          placeholder: helptext.users.system_select.placeholder,
          tooltip: helptext.users.system_select.tooltip,
          multiple: true,
          options: [],
        },
        {
          type: 'chip',
          name: 'searched_entries',
          placeholder: helptext.users.search.placeholder,
          tooltip: helptext.users.search.tooltip,
          value: this.searchedEntries,
          id: 'selected-entries_chiplist',
          autocomplete: true,
          searchOptions: [],
          parent: this,
          updater: this.updateSearchOptions,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected aroute: ActivatedRoute, protected loader: AppLoaderService,
    protected router: Router, protected userService: UserService, private dialog: DialogService,
    protected differs: IterableDiffers) {
    this.differ = differs.find([]).create(null);
  }

  preInit(): void {
    const paramMap: any = (<any> this.aroute.params).getValue();
    this.pk = paramMap.pk;
  }

  async validateEntry(value: any): Promise<void> {
    const validEntry = await this.userService.getUserObject(value);
    const chips = document.getElementsByTagName('mat-chip');
    if (!validEntry) {
      chips.item(chips.length - 1).classList.add('chip-warn');
    }
    this.entryErrs = document.getElementsByClassName('chip-warn');
    this.entryErrBool = this.entryErrs.length !== 0;
    this.allowSubmit();
  }

  allowSubmit(): void {
    if ((this.dq || this.oq)
        && (this.selectedEntriesValue.value && this.selectedEntriesValue.value.length > 0
        || this.searchedEntries && this.searchedEntries.length > 0)
        && this.entryErrBool === false) {
      this.save_button_enabled = true;
    } else {
      this.save_button_enabled = false;
    }
  }

  // This is here because selecting an item from autocomplete doesn't trigger value change
  // Unsubscribes automatically
  ngDoCheck(): void {
    this.differ.diff(this.searchedEntries);
    if (this.searchedEntries.length > 0) {
      this.allowSubmit();
    }
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.route_success = ['storage', 'pools', 'user-quotas', this.pk];
    this.selectedEntriesField = _.find(this.fieldConfig, { name: 'system_entries' });
    this.selectedEntriesValue = this.entityForm.formGroup.controls['system_entries'];
    this.entryField = _.find(this.fieldSets.find((set) => set.name === helptext.users.user_title).config,
      { name: 'searched_entries' });

    this.ws.call('user.query').pipe(untilDestroyed(this)).subscribe((res) => {
      res.map((entry) => {
        this.selectedEntriesField.options.push({ label: entry.username, value: entry.uid });
      });
    });

    this.entityForm.formGroup.controls['data_quota'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.dq = res;
      this.allowSubmit();
    });

    this.entityForm.formGroup.controls['obj_quota'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.oq = res;
      this.allowSubmit();
    });

    this.entityForm.formGroup.controls['system_entries'].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.allowSubmit();
    });

    this.entityForm.formGroup.controls['searched_entries'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: any) => {
      if (value) {
        this.validateEntry(value[value.length - 1]);
      }
    });

    entityEdit.formGroup.controls['data_quota'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: any) => {
      const formField = _.find(this.fieldConfig, { name: 'data_quota' });
      const filteredValue = value ? this.storageService.convertHumanStringToNum(value, false, 'kmgtp') : undefined;
      formField['hasErrors'] = false;
      formField['errors'] = '';
      if (filteredValue !== undefined && isNaN(filteredValue)) {
        formField['hasErrors'] = true;
        formField['errors'] = helptext.shared.input_error;
      }
    });
  }

  blurEvent(parent: any): void {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'data_quota');
    }
  }

  transformValue(parent: any, fieldname: string): void {
    parent.entityForm.formGroup.controls[fieldname].setValue(parent.storageService.humanReadable || 0);
    parent.storageService.humanReadable = '';
  }

  updateSearchOptions(value = '', parent: any): void {
    (parent.userService as UserService).userQueryDSCache(value).pipe(untilDestroyed(this)).subscribe((items) => {
      const entries: Option[] = [];
      for (let i = 0; i < items.length; i++) {
        entries.push({ label: items[i].username, value: items[i].username });
      }
      parent.entryField.searchOptions = entries;
    });
  }

  customSubmit(data: any): void {
    const payload: any[] = [];
    if (!data.system_entries) {
      data.system_entries = [];
    }
    if (data.searched_entries.length > 0) {
      data.searched_entries.forEach((entry: any) => {
        if (!data.system_entries.includes(entry)) {
          data.system_entries.push(entry);
        }
      });
    }

    if (data.system_entries) {
      data.system_entries.forEach((entry: any) => {
        if (data.data_quota) {
          const dq = this.storageService.convertHumanStringToNum(data.data_quota);
          if (dq >= 0) {
            payload.push({
              quota_type: 'USER',
              id: entry.toString(),
              quota_value: this.storageService.convertHumanStringToNum(data.data_quota),
            });
          }
        }
        if (data.obj_quota && data.obj_quota >= 0) {
          payload.push({
            quota_type: 'USEROBJ',
            id: entry.toString(),
            quota_value: parseInt(data.obj_quota, 10),
          });
        }
      });
    }

    this.loader.open();
    this.ws.call('pool.dataset.set_quota', [this.pk, payload]).pipe(untilDestroyed(this)).subscribe(() => {
      this.loader.close();
      this.router.navigate(new Array('/').concat(this.route_success));
    }, (err) => {
      this.loader.close();
      this.dialog.errorReport('Error', err.reason, err.trace.formatted);
    });
  }
}
