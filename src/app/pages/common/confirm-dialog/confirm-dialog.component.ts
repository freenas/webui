import { Component, Output, EventEmitter } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { T } from 'app/translate-marker';

@Component({
  selector: 'confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialog {
  title: string;
  message: string;
  buttonMsg: string = T('Continue');
  cancelMsg: string = T('Cancel');
  hideCheckBox = false;
  isSubmitEnabled = false;
  secondaryCheckBox = false;
  secondaryCheckBoxMsg = '';
  method: ApiMethod;
  data: string;
  tooltip: string;
  hideCancel = false;
  textToCopy: string;
  keyTextArea: boolean;
  // TODO: Typo
  customSumbit: any;

  @Output() switchSelectionEmitter = new EventEmitter<boolean>();

  constructor(public dialogRef: MatDialogRef < ConfirmDialog >, protected translate: TranslateService) {
  }

  toggleSubmit(data: MatCheckboxChange): void {
    this.isSubmitEnabled = data.checked;
  }

  secondaryCheckBoxEvent(): void {
    this.switchSelectionEmitter.emit(this.secondaryCheckBox);
  }

  isDisabled(): boolean {
    if (!this.hideCheckBox) {
      return !this.isSubmitEnabled && !this.hideCheckBox;
    }
    return this.secondaryCheckBox ? !this.isSubmitEnabled : false;
  }
}
