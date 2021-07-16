import {
  Component, ViewChild, AfterViewInit, AfterViewChecked, ChangeDetectorRef,
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';
import { EntityUtils, NULL_VALUE } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'form-select',
  styleUrls: ['form-select.component.scss', '../dynamic-field/dynamic-field.scss'],
  templateUrl: './form-select.component.html',
})
export class FormSelectComponent implements Field, AfterViewInit, AfterViewChecked {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  control: AbstractControl;

  @ViewChild('selectTrigger', { static: true }) matSelect: MatSelect;
  @ViewChild('field', { static: true }) field: MatFormField;

  formReady = false;
  initialValue: any;
  selected: any;
  allSelected: boolean;
  private disableAlert = false;
  selectedValues: any[] = [];
  selectStates: boolean[] = []; // Collection of checkmark states
  selectAllStateCache: boolean[] = []; // Cache the state when select all was toggled
  selectAllValueCache: boolean[] = []; // Cache the state when select all was toggled
  customTriggerValue: any;
  private _formValue: any;
  private entityUtils = new EntityUtils();
  get formValue(): any {
    return this._formValue;
  }
  set formValue(value: any) {
    const result = this.config.multiple ? this.selectedValues : this.selected;
    this._formValue = result;
  }

  constructor(public translate: TranslateService, private dialog: DialogService, public cd: ChangeDetectorRef) {
  }

  ngAfterViewInit(): void {
    // Change the value of null to 'null_value' string
    this.config.options = this.config.options.map((option) => {
      if (!option.hasOwnProperty('value')) option = { label: option, value: option };

      option.value = this.entityUtils.changeNull2String(option.value);

      return option;
    });
    this.selectStates = this.config.options.map(() => false);

    this.control = this.group.controls[this.config.name];

    // When the default value is null, Change it to 'null_value' string
    if (this.control.value === null) {
      (this.control as any).value = NULL_VALUE;
    }

    // if control has a value on init
    if (this.control.value && this.control.value.length > 0) {
      this.selectedValues = this.control.value;
      // check if any value is invalid
      if (this.config.multiple && this.config.asyncValidation) {
        for (const v of this.control.value) {
          if (_.find(this.config.options, { value: v }) === undefined) {
            this.config.options.push({ label: v + '(invalid)', value: v });
          }
        }
      }
    }
    this.control.valueChanges.pipe(untilDestroyed(this)).subscribe((evt: any) => {
      // When set the value to null, Change it to 'null_value' string
      if (this.control.value === null) {
        (this.control as any).value = NULL_VALUE;
      }

      if (evt) {
        if (this.config.multiple && Array.isArray(evt)) {
          this.selectedValues = evt.map((item) => {
            // When set the value to null, Change it to 'null_value' string
            if (item === null) {
              item = NULL_VALUE;
            }
            return item;
          });
          const newStates = this.config.options.map((item) => this.selectedValues.indexOf(item.value) !== -1);
          const triggerValue = [];
          for (let i = 0; i < this.config.options.length; i++) {
            const item = this.config.options[i];
            if (this.selectedValues.indexOf(item.value) !== -1) {
              triggerValue.push(item.label);
            }
          }
          this.selectStates = newStates;
          this.customTriggerValue = triggerValue;
        }
      }
    });
  }

  ngAfterViewChecked(): void {
    if (!this.formReady && typeof this.config.options !== 'undefined' && this.config.options && this.config.options.length > 0) {
      const newStates = this.config.options.map((item) => item && this.selectedValues.indexOf(item.value) !== -1);
      this.selectStates = newStates;
      this.updateValues();
      this.formReady = true;
      this.cd.detectChanges();
    }
  }

  onChangeOption($event: MatSelectChange): void {
    if (this.config.onChangeOption !== undefined && this.config.onChangeOption != null) {
      this.config.onChangeOption({ event: $event });
    }
  }

  showAlert(option: any): void {
    if (!this.shouldAlertOnOption(option) || this.disableAlert) return;

    const conf: DialogFormConfiguration = {
      title: T('Alert'),
      message: this.config.alert.message,
      hideCancel: true,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'disable_alert',
          placeholder: T('Don\'t show this message again'),
        },
      ],
      saveButtonText: T('OK'),
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close(true);
        if (entityDialog.formValue.disable_alert) {
          this.disableAlert = true;
        }
      },
    };
    this.dialog.dialogForm(conf);
  }

  onSelect(option: any): void {
    if (this.config.alert) {
      this.showAlert(option);
    }
    this.selected = option.value;
    this.group.value[this.config.name] = this.selected;
    this.formValue = this.selected;
  }

  onToggleSelectAll(): void {
    if (!this.allSelected) {
      // Cache all the things...
      this.selectAllStateCache = Object.assign([], this.selectStates);// cache the checkmark states
      this.selectAllValueCache = Object.assign([], this.selectedValues);// cache the values

      // Deal with the values...
      const newValues = this.config.options.map((item) => item.value);
      this.selectedValues = newValues;

      // Deal with checkmark states...
      this.selectStates.fill(true);

      // ensure all template elements that care, know that everything is selected
      this.allSelected = true;
    } else {
      this.selectStates = this.selectAllStateCache;
      this.selectedValues = this.selectAllValueCache;
      this.allSelected = false;
    }

    // let testOption = this.matSelect.options._results[0];
  }

  isDisabled(index: number): boolean {
    const option = this.config.options[index];
    return option.disabled ? option.disabled : false;
  }

  isHiddenFromDisplay(index: number): boolean {
    const option = this.config.options[index];
    return option.hiddenFromDisplay ? option.hiddenFromDisplay : false;
  }

  onToggleSelect(option: any): void {
    if (!this.config.multiple) {
      this.onSelect(option);
      return;
    }

    if (this.selectedValues.findIndex((v) => v === option.value) >= 0 && this.config.alert) {
      this.showAlert(option);
    }
    this.group.value[this.config.name] = this.selectedValues;
  }

  updateValues(): void {
    const newValues: any[] = [];
    const triggerValue: any[] = [];
    this.selectStates.forEach((item, index) => {
      if (item) {
        newValues.push(this.config.options[index].value);
        triggerValue.push(this.config.options[index].label);
      }
    });
    this.selectedValues = newValues;
    this.customTriggerValue = triggerValue;
    this.formValue = '';
  }

  shouldAlertOnOption(option: any): boolean {
    return this.config.alert ? this.config.alert.forValues.findIndex((v) => v == option.value) >= 0 : false;
  }
}
