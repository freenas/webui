import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'form-combobox',
  styleUrls: ['form-combobox.component.scss', '../dynamic-field/dynamic-field.css'],
  templateUrl: './form-combobox.component.html',
})
export class FormComboboxComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService) {}

  onChangeOption(value) {
    this.group.controls[this.config.name].setValue(value);
  }

  updateSearchOptions(value) {
    if (this.config.updater && this.config.parent) {
      if (this.config.updateLocal) {
        this.config.updater(value, this.config.parent, this.config);
      } else {
        this.config.updater(value, this.config.parent);
      }
    } else {
      value = value.toLowerCase();
      const searchOptions = [];
      for (let i = 0; i < this.config.options.length; i++) {
        if (this.config.options[i].label.toLowerCase().includes(value)) {
          searchOptions.push(this.config.options[i]);
        }
      }
      this.config.searchOptions = searchOptions;
    }
  }
}
