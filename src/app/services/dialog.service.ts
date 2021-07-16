import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { ConfirmOptions, ConfirmOptionsWithSecondaryCheckbox } from 'app/interfaces/dialog.interface';
import { ConfirmDialog } from 'app/pages/common/confirm-dialog/confirm-dialog.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { ErrorDialog } from 'app/pages/common/error-dialog/error-dialog.component';
import { GeneralDialogComponent, GeneralDialogConfig } from 'app/pages/common/general-dialog/general-dialog.component';
import { InfoDialog } from 'app/pages/common/info-dialog/info-dialog.component';
import { PasswordDialog } from 'app/pages/common/password-dialog/password-dialog.component';
import { SelectDialogComponent } from 'app/pages/common/select-dialog/select-dialog.component';
import { T } from 'app/translate-marker';
import { AppLoaderService } from './app-loader/app-loader.service';
import { WebSocketService } from './ws.service';

@UntilDestroy()
@Injectable()
export class DialogService {
  protected loaderOpen = false;

  constructor(private dialog: MatDialog, private ws: WebSocketService, protected loader: AppLoaderService) {
    /* Close all open dialogs when websocket connection is dropped */
    this.ws.onCloseSubject$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.closeAllDialogs());
  }

  confirm(confirmOptions: ConfirmOptions): Observable<boolean>
  confirm(confirmOptions: ConfirmOptionsWithSecondaryCheckbox): MatDialogRef<ConfirmDialog, unknown>
  /**
   * @deprecated Replace with newer syntax that uses options object.
   */
  confirm(title: string, message: string, hideCheckBox?: boolean, buttonMsg?: string, secondaryCheckBox?: boolean,
    secondaryCheckBoxMsg?: string, method?: string, data?: any, tooltip?: any, hideCancel?: boolean, cancelMsg?: string,
    disableClose?: boolean, textToCopy?: string, keyTextArea?: boolean): any
  confirm(...args: any[]): any {
    let options: ConfirmOptions | ConfirmOptionsWithSecondaryCheckbox;
    if (typeof args[0] === 'object') {
      options = args[0];
    } else {
      options = _.zipObject(
        [
          'title', 'message', 'hideCheckBox', 'buttonMsg', 'secondaryCheckBox', 'secondaryCheckBoxMsg',
          'method', 'data', 'tooltip', 'hideCancel', 'cancelMsg', 'disableClose', 'textToCopy', 'keyTextArea',
        ],
        args,
      ) as ConfirmOptionsWithSecondaryCheckbox;
    }

    const dialogRef = this.dialog.open(ConfirmDialog, { disableClose: options.disableClose || false });

    dialogRef.componentInstance.title = options.title;
    dialogRef.componentInstance.message = options.message;

    if (options.buttonMsg) {
      dialogRef.componentInstance.buttonMsg = options.buttonMsg;
    }

    if (options.hideCheckBox) {
      dialogRef.componentInstance.hideCheckBox = options.hideCheckBox;
    }

    if (options.tooltip) {
      dialogRef.componentInstance.tooltip = options.tooltip;
    }

    if (options.hideCancel) {
      dialogRef.componentInstance.hideCancel = options.hideCancel;
      dialogRef.disableClose = options.hideCancel;
    }
    if (options.cancelMsg) {
      dialogRef.componentInstance.cancelMsg = options.cancelMsg;
    }

    if (options.textToCopy) {
      dialogRef.componentInstance.keyTextArea = options.keyTextArea;
    }

    if (options.keyTextArea) {
      dialogRef.componentInstance.textToCopy = options.textToCopy;
    }

    if ('secondaryCheckBox' in options && options.secondaryCheckBox) {
      dialogRef.componentInstance.secondaryCheckBox = options.secondaryCheckBox;
      dialogRef.componentInstance.secondaryCheckBoxMsg = options.secondaryCheckBoxMsg;
      dialogRef.componentInstance.data = options.data;
      dialogRef.componentInstance.method = options.method;
      dialogRef.componentInstance.switchSelectionEmitter.pipe(untilDestroyed(this)).subscribe((selection: any) => {
        const data = (options as ConfirmOptionsWithSecondaryCheckbox).data;
        if (selection) {
          if (data[0] && data[0].hasOwnProperty('reboot')) {
            data[0].reboot = !data[0].reboot;
          }
          if (data[0] && data[0].hasOwnProperty('overcommit')) {
            data[0].overcommit = !data[0].overcommit;
          }
          return dialogRef;
        }
      });
      return dialogRef;
    }
    return dialogRef.afterClosed();
  }

  passwordConfirm(message: string, disableClose = true): Observable<boolean> {
    const dialogRef = this.dialog.open(PasswordDialog, { disableClose });

    dialogRef.componentInstance.message = message;

    return dialogRef.afterClosed();
  }

  errorReport(title: string, message: string, backtrace = '', logs?: any): Observable<boolean> {
    const dialogRef = this.dialog.open(ErrorDialog);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;
    dialogRef.componentInstance.backtrace = backtrace;
    if (logs) {
      dialogRef.componentInstance.logs = logs;
    }

    return dialogRef.afterClosed();
  }

  Info(title: string, info: string, width = '500px', icon = 'report_problem', is_html = false): Observable<boolean> {
    const dialogRef = this.dialog.open(InfoDialog, { width });

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.info = info;
    dialogRef.componentInstance.icon = icon;
    dialogRef.componentInstance.is_html = is_html;

    return dialogRef.afterClosed();
  }

  select(
    title: string,
    options: any[],
    optionPlaceHolder: string,
    method: ApiMethod,
    params?: any,
  ): void {
    let data: any;
    const dialogRef = this.dialog.open(SelectDialogComponent, { width: '300px' });

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.options = options;
    dialogRef.componentInstance.optionPlaceHolder = optionPlaceHolder;
    dialogRef.componentInstance.method = method;

    dialogRef.componentInstance.switchSelectionEmitter.pipe(untilDestroyed(this)).subscribe((selection) => {
      if (selection === 'force') {
        data = { [selection]: true };
      } else {
        data = { [params]: selection };
      }
      dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
        if (res) {
          // TODO: The whole block seems to be doing nothing.
          // eslint-disable-next-line unused-imports/no-unused-vars
          this.ws.call(method, [data]).pipe(untilDestroyed(this)).subscribe((out) => {
            // this.snackBar.open(message, 'close', { duration: 5000 });
          });
        }
      });
    });
  }

  dialogForm(conf: DialogFormConfiguration, disableClose = false): Observable<boolean> {
    const dialogRef = this.dialog.open(EntityDialogComponent, { maxWidth: '420px', minWidth: '350px', disableClose });
    dialogRef.componentInstance.conf = conf;

    return dialogRef.afterClosed();
  }

  dialogFormWide(conf: any): Observable<boolean> {
    const dialogRef = this.dialog.open(EntityDialogComponent, { width: '550px', disableClose: true });
    dialogRef.componentInstance.conf = conf;

    return dialogRef.afterClosed();
  }

  doubleConfirm(title: string, message: string, name: string, confirmBox?: boolean, buttonMsg?: string): any {
    const conf = {
      title,
      message,
      name,
      confirmInstructions: true,
      fieldConfig: [
        {
          type: 'input',
          name: 'name',
          required: true,
          hideErrMsg: true,
        },
        {
          type: 'checkbox',
          name: 'confirm',
          placeholder: T('Confirm'),
          isHidden: !confirmBox,
        },
      ],
      saveButtonText: buttonMsg || T('DELETE'),
      afterInit(entityDialog: EntityDialogComponent) {
        entityDialog.formGroup.controls['name'].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
          entityDialog.submitEnabled = res === name && (confirmBox ? entityDialog.formGroup.controls['confirm'].value : true);
        });
        entityDialog.formGroup.controls['confirm'].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
          entityDialog.submitEnabled = res && (entityDialog.formGroup.controls['name'].value === name);
        });
      },
      customSubmit(entityDialog: EntityDialogComponent) {
        return entityDialog.dialogRef.close(true);
      },
    } as DialogFormConfiguration;
    return this.dialogForm(conf);
  }

  closeAllDialogs(): void {
    for (const openDialog of this.dialog.openDialogs) {
      openDialog.close();
    }
  }

  generalDialog(conf: GeneralDialogConfig, matConfig?: MatDialogConfig): Observable<any> {
    const dialogRef = this.dialog.open(GeneralDialogComponent, matConfig);
    dialogRef.componentInstance.conf = conf;

    return dialogRef.afterClosed();
  }
}
