import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  UntilDestroy, untilDestroyed,
} from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/storage/volumes/volume-import-wizard';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { Wizard } from 'app/pages/common/entity/entity-form/models/wizard.interface';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityWizardComponent } from 'app/pages/common/entity/entity-wizard/entity-wizard.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-volumeimport-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers: [],
})
export class VolumeImportWizardComponent implements WizardConfiguration {
  summary: any = {};
  isLinear = true;
  firstFormGroup: FormGroup;
  summaryTitle = 'Pool Import Summary';
  subs: any;
  saveSubmitText = T('Import');
  entityWizard: EntityWizardComponent;
  protected productType: ProductType;
  protected importIndex = 2;
  title: string;

  wizardConfig: Wizard[] = [{
    label: helptext.is_new_main_label,
    fieldConfig: [
      {
        type: 'radio',
        name: 'is_new',
        placeholder: helptext.is_new_placeholder,
        options: [
          {
            label: helptext.is_new_option1_label,
            name: 'create_new_pool_opt',
            tooltip: helptext.is_new_option1_tooltip,
            value: true,
          },
          {
            label: helptext.is_new_option2_label,
            name: 'import_pool_opt',
            tooltip: helptext.is_new_option2_tooltip,
            value: false,
          },
        ],
        value: true,
      },
    ],
  },
  {
    label: helptext.enctrypted_main_label,
    fieldConfig: [
      {
        type: 'radio',
        name: 'encrypted',
        placeholder: helptext.enctypted_placeholder,
        options: [
          {
            label: helptext.encrypted_option1_label,
            tooltip: helptext.encrypted_option1_tooltip,
            value: false,
          },
          {
            label: helptext.encrypted_option2_label,
            tooltip: helptext.encrypted_option2_tooltip,
            value: true,
          },
        ],
        value: false,
      },
      {
        type: 'select',
        multiple: true,
        name: 'devices',
        placeholder: helptext.devices_placeholder,
        validation: helptext.devices_validation,
        tooltip: helptext.devices_tooltip,
        required: true,
        isHidden: true,
        disabled: true,
        options: [],
        relation: [{
          action: RelationAction.Hide,
          when: [{
            name: 'encrypted',
            value: false,
          }],
        }],
      },
      {
        type: 'upload',
        name: 'key',
        placeholder: helptext.key_placeholder,
        tooltip: helptext.key_tooltip,
        fileLocation: '',
        message: this.messageService,
        updater: this.updater,
        parent: this,
        isHidden: true,
        disabled: true,
        hideButton: true,
        relation: [{
          action: RelationAction.Hide,
          when: [{
            name: 'encrypted',
            value: false,
          }],
        }],
      },
      {
        type: 'input',
        name: 'passphrase',
        placeholder: helptext.passphrase_placeholder,
        tooltip: helptext.passphrase_tooltip,
        inputType: 'password',
        togglePw: true,
        isHidden: true,
        disabled: true,
        relation: [{
          action: RelationAction.Hide,
          when: [{
            name: 'encrypted',
            value: false,
          }],
        }],
      },
    ],
  },
  {
    label: helptext.import_label,
    fieldConfig: [
      {
        type: 'select',
        name: 'guid',
        placeholder: helptext.guid_placeholder,
        tooltip: helptext.guid_tooltip,
        options: [],
        validation: [Validators.required],
        required: true,
      },
    ],
  },
  ];

  updater(file: any, parent: any): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }

  private disks_decrypted = false;
  protected stepper: string;

  protected isNew = true;
  protected encrypted: FormGroup;
  protected devices: FieldConfig;
  protected devices_fg: FormGroup;
  protected key: FieldConfig;
  protected key_fg: FormGroup;
  protected passphrase: FieldConfig;
  protected passphrase_fg: FormGroup;
  protected guid: FieldConfig;
  protected pool: any;
  hideCancel = true;

  constructor(
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    protected dialog: MatDialog,
    protected dialogService: DialogService,
    public messageService: MessageService,
    public modalService: ModalService,
  ) {
  }

  customNext(stepper: any): void {
    if (stepper._selectedIndex === (this.importIndex - 1)) {
      if (this.encrypted && this.encrypted.value) {
        this.decryptDisks(stepper);
      } else {
        this.getImportableDisks();
        stepper.next();
      }
    } else {
      stepper.next();
    }
  }

  decryptDisks(stepper: any): void {
    if (this.devices_fg.status === 'INVALID') {
      this.dialogService.Info(T('Disk Selection Required'), T('Select one or more disks to decrypt.'));
      return;
    }
    if (!this.subs) {
      this.dialogService.Info(T('Encryption Key Required'), T('Select a key before decrypting the disks.'));
    }
    const formData: FormData = new FormData();
    const params = [this.devices_fg.value];
    if (this.passphrase_fg.value != null) {
      params.push(this.passphrase_fg.value);
    }
    formData.append('data', JSON.stringify({
      method: 'disk.decrypt',
      params,
    }));
    formData.append('file', this.subs.file);

    const dialogRef = this.dialog.open(
      EntityJobComponent,
      { data: { title: helptext.decrypt_disks_title }, disableClose: true },
    );
    dialogRef.componentInstance.wspost(this.subs.apiEndPoint, formData);
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close(false);
      this.getImportableDisks();
      stepper.next();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
      dialogRef.close(false);
      this.dialogService.errorReport(T('Error decrypting disks'), res.error, res.exception);
    });
  }

  getImportableDisks(): void {
    const dialogRef = this.dialog.open(
      EntityJobComponent,
      { data: { title: helptext.find_pools_title }, disableClose: true },
    );
    dialogRef.componentInstance.setDescription(helptext.find_pools_msg);
    dialogRef.componentInstance.setCall('pool.import_find', []);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (res && res.result) {
        this.guid.options = [];
        const result = res.result;
        for (let i = 0; i < result.length; i++) {
          this.guid.options.push({ label: result[i].name + ' | ' + result[i].guid, value: result[i].guid });
        }
      }
      dialogRef.close(false);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
      new EntityUtils().handleWSError(this.entityWizard, res, this.dialogService);
      dialogRef.close(false);
    });
  }

  preInit(): void {
    this.productType = window.localStorage.getItem('product_type') as ProductType;
    if (this.productType.includes(ProductType.Scale)) {
      this.wizardConfig.splice(0, 2);
      this.importIndex = 0;
      this.getImportableDisks();
    }

    if (this.isNew) {
      this.title = helptext.import_title;
    } else {
      this.title = helptext.edit_title;
    }
  }

  afterInit(entityWizard: EntityWizardComponent): void {
    this.entityWizard = entityWizard;

    if (!this.productType.includes(ProductType.Scale)) {
      this.encrypted = (< FormGroup > entityWizard.formArray.get([1]).get('encrypted'));
      this.devices = _.find(this.wizardConfig[1].fieldConfig, { name: 'devices' });
      this.devices_fg = (< FormGroup > entityWizard.formArray.get([1]).get('devices'));
      this.key = _.find(this.wizardConfig[1].fieldConfig, { name: 'key' });
      this.key_fg = (< FormGroup > entityWizard.formArray.get([1]).get('key'));
      this.passphrase = _.find(this.wizardConfig[1].fieldConfig, { name: 'passphrase' });
      this.passphrase_fg = (< FormGroup > entityWizard.formArray.get([1]).get('passphrase'));

      this.ws.call('disk.get_encrypted', [{ unused: true }]).pipe(untilDestroyed(this)).subscribe((res) => {
        for (let i = 0; i < res.length; i++) {
          this.devices.options.push({ label: res[i].name, value: res[i].dev });
        }
      });
    }

    this.guid = _.find(this.wizardConfig[this.importIndex].fieldConfig, { name: 'guid' });
    (< FormGroup > entityWizard.formArray.get([this.importIndex]).get('guid'))
      .valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
        const pool = _.find(this.guid.options, { value: res });
        this.summary[T('Pool to import')] = pool['label'];
        const pool_label = pool.label.split(' ');
        if (pool.label.length > 0) {
          this.pool = pool_label[0];
        }
      });

    if (!this.productType.includes(ProductType.Scale)) {
      this.messageService.messageSourceHasNewMessage$.pipe(untilDestroyed(this)).subscribe((message) => {
        this.key_fg.setValue(message);
      });
    }
  }

  customSubmit(value: any): void {
    if (value.encrypted) {
      const formData: FormData = new FormData();
      const params: any = { guid: value.guid };
      if (value.passphrase && value.passphrase != null) {
        params['passphrase'] = value.passphrase;
      }
      formData.append('data', JSON.stringify({
        method: 'pool.import_pool',
        params: [params],
      }));
      formData.append('file', this.subs.file);
      const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: 'Importing Pool' }, disableClose: true });
      dialogRef.componentInstance.wspost(this.subs.apiEndPoint, formData);
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        dialogRef.close(false);
        this.modalService.close('slide-in-form');
        this.modalService.refreshTable();
      });
      dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
        dialogRef.close(false);
        this.errorReport(res);
      });
    } else {
      const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Importing Pool') }, disableClose: true });
      dialogRef.componentInstance.setDescription(T('Importing Pool...'));
      dialogRef.componentInstance.setCall('pool.import_pool', [{ guid: value.guid }]);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        dialogRef.close(false);
        if (this.pool) {
          this.modalService.close('slide-in-form');
          this.modalService.refreshTable();
        } else {
          console.error('Something went wrong. No pool found!');
        }
      });
      dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
        dialogRef.close(false);
        this.errorReport(res);
      });
    }
  }

  errorReport(res: any): void {
    if (res.reason && res.trace) {
      this.dialogService.errorReport(T('Error importing pool'), res.reason, res.trace.formatted);
    } else if (res.error && res.exception) {
      this.dialogService.errorReport(T('Error importing pool'), res.error, res.exception);
    } else {
      console.error(res);
    }
  }
}
