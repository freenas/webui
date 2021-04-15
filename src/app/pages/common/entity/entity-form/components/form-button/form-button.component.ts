import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';

@Component({
  selector: 'form-button',
  styleUrls: ['form-button.component.scss'],
  template: `
    <div
      *ngIf="!config.isHidden"
      class="dynamic-field form-button"
      [formGroup]="group">
      <button
        mat-button
        color="accent"
        [disabled]="config.disabled"
        [type]="config.inputType ? config.inputType : 'submit'"
        (click)="customEventMethod($event)"
        ix-auto
        ix-auto-type="button"
        ix-auto-identifier="{{config.customEventActionLabel | uppercase}}">
        {{ config.label | translate }}
      </button>
    </div>
  `,
})
export class FormButtonComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  constructor(public translate: TranslateService) {}

  customEventMethod($event) {
    if (this.config.customEventMethod !== undefined && this.config.customEventMethod != null) {
      this.config.customEventMethod({ event: $event });
    }
    $event.preventDefault();
  }
}
