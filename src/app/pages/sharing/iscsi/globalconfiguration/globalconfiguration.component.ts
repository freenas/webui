import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { shared, helptext_sharing_iscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import {
  DialogService, WebSocketService, AppLoaderService, SystemGeneralService,
} from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-globalconfiguration',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class GlobalconfigurationComponent implements FormConfiguration {
  queryCall: 'iscsi.global.config' = 'iscsi.global.config';
  editCall: 'iscsi.global.update' = 'iscsi.global.update';

  fieldSets: FieldSet[] = [
    {
      name: helptext_sharing_iscsi.fieldset_globalconf,
      label: true,
      class: 'globalconf',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'basename',
          placeholder: helptext_sharing_iscsi.globalconf_placeholder_basename,
          tooltip: helptext_sharing_iscsi.globalconf_tooltip_basename,
          required: true,
          validation: helptext_sharing_iscsi.globalconf_validators_basename,
        },
        {
          type: 'chip',
          name: 'isns_servers',
          placeholder: helptext_sharing_iscsi.globalconf_placeholder_isns_servers,
          tooltip: helptext_sharing_iscsi.globalconf_tooltip_isns_servers,
        },
        {
          type: 'input',
          name: 'pool_avail_threshold',
          placeholder: helptext_sharing_iscsi.globalconf_placeholder_pool_avail_threshold,
          tooltip: helptext_sharing_iscsi.globalconf_tooltip_pool_avail_threshold,
          inputType: 'number',
        },
        {
          type: 'checkbox',
          name: 'alua',
          placeholder: helptext_sharing_iscsi.globalconf_placeholder_alua,
          tooltip: helptext_sharing_iscsi.globalconf_tooltip_alua,
          isHidden: true,
          disabled: true,
        },
      ],
    },
  ];

  constructor(
    protected dialogService: DialogService,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    private sysGeneralService: SystemGeneralService,
  ) {}

  afterInit(entityForm: EntityFormComponent): void {
    entityForm.submitFunction = entityForm.editCall;
    this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res === ProductType.Enterprise) {
        entityForm.setDisabled('alua', false, false);
      }
    });
  }

  beforeSubmit(value: any): void {
    if (value.pool_avail_threshold == '') {
      value.pool_avail_threshold = null;
    }
  }

  afterSubmit(): void {
    this.ws.call('service.query', [[]]).pipe(untilDestroyed(this)).subscribe((service_res) => {
      const service = _.find(service_res, { service: ServiceName.Iscsi });
      if (!service.enable) {
        this.dialogService.confirm(shared.dialog_title, shared.dialog_message,
          true, shared.dialog_button).pipe(untilDestroyed(this)).subscribe((dialogRes: boolean) => {
          if (dialogRes) {
            this.loader.open();
            this.ws.call('service.update', [service.id, { enable: true }]).pipe(untilDestroyed(this)).subscribe(() => {
              this.ws.call('service.start', [service.service]).pipe(untilDestroyed(this)).subscribe(() => {
                this.loader.close();
                this.dialogService.Info(T('iSCSI') + shared.dialog_started_title,
                  T('The iSCSI') + shared.dialog_started_message, '250px', 'info');
              }, (err) => {
                this.loader.close();
                this.dialogService.errorReport(err.error, err.reason, err.trace.formatted);
              });
            }, (err) => {
              this.loader.close();
              this.dialogService.errorReport(err.error, err.reason, err.trace.formatted);
            });
          }
        });
      }
    });
  }
}
