import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { helptext_system_bootenv } from 'app/helptext/system/boot-env';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { BootEnvService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-bootenv-create',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [BootEnvService],
})
export class BootEnvironmentCreateComponent implements FormConfiguration {
  route_success: string[] = ['system', 'boot'];
  addCall: 'bootenv.create' = 'bootenv.create';
  pk: any;
  isNew = false;
  isEntity = true;
  protected entityForm: EntityFormComponent;

  fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: helptext_system_bootenv.create_name_placeholder,
      tooltip: helptext_system_bootenv.create_name_tooltip,
      validation: [regexValidator(this.bootEnvService.bootenv_name_regex)],
      required: true,
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected bootEnvService: BootEnvService,
  ) {}

  preInit(entityForm: EntityFormComponent): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
    });
    this.entityForm = entityForm;
    entityForm.submitFunction = this.submitFunction;
  }

  submitFunction(entityForm: any): Observable<any> {
    const payload: any = {};
    payload['name'] = entityForm.name;
    return this.ws.call('bootenv.create', [payload]);
  }
}
