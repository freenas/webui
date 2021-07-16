import { Component, Output, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';

@Component({
  selector: 'app-select-dialog',
  templateUrl: './select-dialog.component.html',
  styleUrls: ['./select-dialog.component.scss'],
})
export class SelectDialogComponent {
  title: string;
  options: Option[];
  optionPlaceHolder: string;
  method: string;
  params: string;
  displaySelection: string;
  @Output() switchSelectionEmitter = new EventEmitter<string>();

  constructor(public dialogRef: MatDialogRef<SelectDialogComponent>, protected translate: TranslateService) {}

  switchSelection(): void {
    this.switchSelectionEmitter.emit(this.displaySelection);
  }
}
