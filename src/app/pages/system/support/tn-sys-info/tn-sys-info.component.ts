import { Component, Input, OnInit } from '@angular/core';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { T } from 'app/translate-marker';
import { EntityUtils } from 'app/pages/common/entity/utils';

@Component({
  selector: 'app-tn-sys-info',
  templateUrl: './tn-sys-info.component.html',
})
export class TnSysInfoComponent implements OnInit {
  product_type: string;
  @Input() customer_name;
  @Input() features;
  @Input() contract_type;
  @Input() expiration_date;
  @Input() model;
  @Input() sys_serial;
  @Input() add_hardware;
  @Input() daysLeftinContract;

  constructor(protected ws: WebSocketService, protected dialogService: DialogService,
    protected loader: AppLoaderService) { }

  ngOnInit() {
    this.product_type = window.localStorage['product_type'];
  }

  updateLicense() {
    const self = this;
    const licenseForm: DialogFormConfiguration = {
      title: helptext.update_license.dialog_title,
      fieldConfig: [
        {
          type: 'textarea',
          name: 'license',
          placeholder: helptext.update_license.license_placeholder,
          required: true,
        },
      ],
      saveButtonText: helptext.update_license.save_button,
      customSubmit(entityDialog) {
        const value = entityDialog.formValue.license ? entityDialog.formValue.license.trim() : null;
        self.loader.open();
        entityDialog.error = null;
        entityDialog.formGroup.controls['license'].valueChanges.subscribe((res) => {
          if (res.length === 0) {
            // Reset input error state on clear
            entityDialog.formGroup.controls['license'].setErrors();
            entityDialog.formGroup.controls['license'].markAsUntouched();
            entityDialog.error = null;
          }
        });
        self.ws.call('system.license_update', [value]).subscribe((res) => {
          entityDialog.dialogRef.close(true);
          self.loader.close();
          self.dialogService.confirm(helptext.update_license.reload_dialog_title,
            helptext.update_license.reload_dialog_message, true, helptext.update_license.reload_dialog_action)
            .subscribe((confirm: any) => {
              if (confirm) {
                document.location.reload(true);
              }
            });
        },
        (err) => {
          self.loader.close();
          const errorText = err.reason ? err.reason.replace('[EFAULT]', '') : T('Something went wrong. Please try again.');
          entityDialog.formGroup.controls['license'].setErrors({ invalid: true });
          entityDialog.error = errorText;
        });
      },
    };
    this.dialogService.dialogForm(licenseForm);
  }
}
