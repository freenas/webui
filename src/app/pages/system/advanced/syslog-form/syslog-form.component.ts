import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  DialogService,
  LanguageService,
  StorageService,
  SystemGeneralService,
  WebSocketService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-syslog-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [],
})
export class SyslogFormComponent implements FormConfiguration {
  queryCall: 'system.advanced.config' = 'system.advanced.config';
  updateCall = 'system.advanced.update';
  protected isOneColumnForm = true;
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_advanced.fieldset_kernel,
      label: false,
      class: 'console',
      config: [
        {
          type: 'checkbox',
          name: 'fqdn_syslog',
          placeholder: helptext_system_advanced.fqdn_placeholder,
          tooltip: helptext_system_advanced.fqdn_tooltip,
        },
        {
          type: 'select',
          name: 'sysloglevel',
          placeholder: helptext_system_advanced.sysloglevel.placeholder,
          tooltip: helptext_system_advanced.sysloglevel.tooltip,
          options: helptext_system_advanced.sysloglevel.options,
        },
        {
          type: 'input',
          name: 'syslogserver',
          placeholder: helptext_system_advanced.syslogserver.placeholder,
          tooltip: helptext_system_advanced.syslogserver.tooltip,
        },
        {
          type: 'select',
          name: 'syslog_transport',
          placeholder: helptext_system_advanced.syslog_transport.placeholder,
          tooltip: helptext_system_advanced.syslog_transport.tooltip,
          options: helptext_system_advanced.syslog_transport.options,
        },
        {
          type: 'select',
          name: 'syslog_tls_certificate',
          placeholder:
            helptext_system_advanced.syslog_tls_certificate.placeholder,
          tooltip: helptext_system_advanced.syslog_tls_certificate.tooltip,
          options: [],
          relation: [
            {
              action: RelationAction.Show,
              when: [
                {
                  name: 'syslog_transport',
                  value: 'TLS',
                },
              ],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'syslog',
          placeholder: helptext_system_advanced.system_dataset_placeholder,
          tooltip: helptext_system_advanced.system_dataset_tooltip,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  private entityForm: EntityFormComponent;
  private configData: SystemGeneralConfig;
  title = helptext_system_advanced.fieldset_syslog;

  constructor(
    protected router: Router,
    protected language: LanguageService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    public http: HttpClient,
    protected storage: StorageService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService,
  ) {
    this.sysGeneralService.sendConfigData$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.configData = res;
    });
  }

  reconnect(href: string): void {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      window.location.replace(href);
    } else {
      setTimeout(() => {
        this.reconnect(href);
      }, 5000);
    }
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.ws.call('systemdataset.config').pipe(untilDestroyed(this)).subscribe((res) => {
      entityEdit.formGroup.controls.syslog.setValue(res.syslog);
    });
  }

  customSubmit(body: any): Subscription {
    this.loader.open();
    const syslog_value = body.syslog;
    delete body.syslog;

    return this.ws.call('system.advanced.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
      this.ws.job('systemdataset.update', [{ syslog: syslog_value }]).pipe(untilDestroyed(this)).subscribe((job) => {
        if (job.error) {
          this.loader.close();
          if (job.exc_info && job.exc_info.extra) {
            (job as any).extra = job.exc_info.extra;
          }
          new EntityUtils().handleWSError(this, job);
        }
        if (job.state === JobState.Success) {
          this.loader.close();
          this.entityForm.success = true;
          this.entityForm.formGroup.markAsPristine();
          this.modalService.close('slide-in-form');
          this.sysGeneralService.refreshSysGeneral();
        }
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err);
      });
    },
    (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
