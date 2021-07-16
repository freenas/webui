import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import helptext from 'app/helptext/data-protection/smart/smart';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { SmartTestUi } from 'app/interfaces/smart-test.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-smart-test-add',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class SmartFormComponent implements FormConfiguration {
  queryCall: 'smart.test.query' = 'smart.test.query';
  addCall: 'smart.test.create' = 'smart.test.create';
  editCall: 'smart.test.update' = 'smart.test.update';
  customFilter: any[] = [];
  protected entityForm: EntityFormComponent;
  isEntity = true;
  isNew = false;
  protected disk_field: FieldConfig;
  pk: number;
  title: string;
  protected isOneColumnForm = true;

  fieldSets: FieldSets = new FieldSets([
    {
      name: 'S.M.A.R.T. Test',
      label: true,
      config: [
        {
          type: 'select',
          name: 'disks',
          placeholder: helptext.smarttest_disks_placeholder,
          tooltip: helptext.smarttest_disks_tooltip,
          options: [],
          multiple: true,
          required: true,
          validation: helptext.smarttest_disks_validation,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'all_disks',
              value: true,
            }],
          }],
        }, {
          type: 'checkbox',
          name: 'all_disks',
          placeholder: helptext.smarttest_all_disks_placeholder,
          tooltip: helptext.smarttest_all_disks_tooltip,
        }, {
          type: 'select',
          name: 'type',
          placeholder: helptext.smarttest_type_placeholder,
          tooltip: helptext.smarttest_type_tooltip,
          options: [
            {
              label: T('LONG'),
              value: SmartTestType.Long,
            },
            {
              label: T('SHORT'),
              value: SmartTestType.Short,
            },
            {
              label: T('CONVEYANCE'),
              value: SmartTestType.Conveyance,
            },
            {
              label: T('OFFLINE'),
              value: SmartTestType.Offline,
            },
          ],
          required: true,
          validation: helptext.smarttest_type_validation,
        }, {
          type: 'input',
          name: 'desc',
          placeholder: helptext.smarttest_desc_placeholder,
          tooltip: helptext.smarttest_desc_tooltip,
        },
        {
          type: 'scheduler',
          name: 'cron_schedule',
          placeholder: helptext.smarttest_picker_placeholder,
          tooltip: helptext.smarttest_picker_tooltip,
          validation: helptext.smarttest_picker_validation,
          required: true,
          value: '0 0 * * *',
          noMinutes: true,
        },
      ],
    },
    { name: 'divider', divider: true },
  ]);

  constructor(protected ws: WebSocketService, protected modalService: ModalService) {
    this.disk_field = this.fieldSets.config('disks');
    this.ws.call('smart.test.disk_choices').pipe(untilDestroyed(this)).subscribe(
      (choices) => {
        for (const key in choices) {
          this.disk_field.options.push({ label: choices[key], value: key });
        }
      }, (err) => new EntityUtils().handleWSError(this, err),
    );
    this.modalService.getRow$.pipe(take(1)).pipe(untilDestroyed(this)).subscribe((id: string) => {
      this.customFilter = [[['id', '=', id]]];
    });
  }

  resourceTransformIncomingRestData(data: SmartTestUi): SmartTestUi {
    data.cron_schedule = `0 ${data.schedule.hour} ${data.schedule.dom} ${data.schedule.month} ${data.schedule.dow}`;
    return data;
  }

  async afterInit(entityForm: EntityFormComponent): Promise<void> {
    this.entityForm = entityForm;
    this.pk = entityForm.pk;
    this.isNew = entityForm.isNew;
    this.title = entityForm.isNew ? helptext.smart_test_add : helptext.smart_test_edit;
  }

  beforeSubmit(value: any): void {
    const spl = value.cron_schedule.split(' ');
    delete value.cron_schedule;

    value.schedule = {
      hour: spl[1],
      dom: spl[2],
      month: spl[3],
      dow: spl[4],
    };

    if (value.all_disks) {
      value.disks = [];
    }
  }
}
