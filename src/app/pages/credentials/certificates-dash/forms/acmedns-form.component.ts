import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { helptext_system_acme as helptext, helptext_system_acme } from 'app/helptext/system/acme';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { DialogService, WebSocketService, AppLoaderService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-acmedns-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class AcmednsFormComponent implements FormConfiguration {
  addCall: 'acme.dns.authenticator.create' = 'acme.dns.authenticator.create';
  queryCall: 'acme.dns.authenticator.query' = 'acme.dns.authenticator.query';
  editCall: 'acme.dns.authenticator.update' = 'acme.dns.authenticator.update';
  isEntity = true;
  protected isOneColumnForm = true;
  title: string;

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [];

  protected entityForm: EntityFormComponent;
  private rowNum: number;
  queryCallOption: [QueryFilter<DnsAuthenticator>];
  private getRow: Subscription;

  constructor(
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    protected dialog: DialogService,
    private modalService: ModalService,
  ) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId: number) => {
      this.rowNum = rowId;
      this.queryCallOption = [['id', '=', rowId]];
      this.getRow.unsubscribe();
    });
    this.ws.call('acme.dns.authenticator.authenticator_schemas').pipe(untilDestroyed(this)).subscribe((schemas) => {
      const authenticatorConfig: FieldConfig = {
        type: 'select',
        name: 'authenticator',
        placeholder: helptext.authenticator_provider_placeholder,
        tooltip: helptext.authenticator_provider_tooltip,
        options: [
        ],
        parent: this,
      };
      const fieldSet: FieldSet[] = [
        {
          name: 'Add DNS Authenticator',
          label: true,
          config: [
            {
              type: 'input',
              name: 'name',
              placeholder: helptext.authenticator_name_placeholder,
              tooltip: helptext.authenticator_name_tooltip,
              required: true,
              validation: helptext.authenticator_name_validation,
              parent: this,
            },
            authenticatorConfig,
          ],
        },
      ];

      for (const schema of schemas) {
        authenticatorConfig.options.push({ label: schema.key, value: schema.key });
        for (const input of schema.schema) {
          const conf: FieldConfig = {
            name: input._name_,
            type: 'input',
            required: input._required_,
            placeholder: input.title,
            parent: this,
            relation: [
              {
                action: RelationAction.Show,
                when: [{
                  name: 'authenticator',
                  value: schema.key,
                }],
              },
            ],
          };
          fieldSet[0].config.push(conf);
        }
      }
      authenticatorConfig.value = schemas[0].key;
      this.fieldSets = fieldSet;
    });
  }

  resourceTransformIncomingRestData(data: DnsAuthenticator): any {
    const transformed: any = { ...data };
    for (const item in data.attributes) {
      transformed[item] = data.attributes[item as keyof DnsAuthenticator['attributes']];
    }
    return transformed;
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.title = this.rowNum ? helptext_system_acme.edit_title : helptext_system_acme.add_title;
  }

  /**
   * Avoid sending empty strings "" to backend,
   * as it fails backend validation in some cases.
   */
  clean(formValues: any): any {
    const cleanedValues = { ...formValues };

    this.fieldConfig.forEach((field) => {
      if (!field.required && cleanedValues[field.name] === '') {
        delete cleanedValues[field.name];
      }
    });

    return cleanedValues;
  }

  beforeSubmit(value: any): void {
    const attributes: any = {};
    for (const item in value) {
      if (item != 'name' && item != 'authenticator') {
        attributes[item] = value[item];
        delete value[item];
      }
    }
    value.attributes = attributes;

    if (this.rowNum) {
      delete value.authenticator;
    }
  }

  afterSubmit(): void {
    this.modalService.refreshTable();
  }
}
