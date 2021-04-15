import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_ca } from 'app/helptext/system/ca';
import { RestService, WebSocketService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-ca-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class CertificateAuthorityEditComponent {
  protected queryCall = 'certificateauthority.query';
  protected editCall = 'certificateauthority.update';
  protected route_success: string[] = ['system', 'ca'];
  protected isEntity = true;
  protected queryCallOption: any[] = [['id', '=']];

  protected fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_ca.edit.fieldset_certificate,
      label: true,
      class: 'certificate',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_system_ca.edit.name.placeholder,
          tooltip: helptext_system_ca.edit.name.tooltip,
          required: true,
          validation: helptext_system_ca.edit.name.validation,
        },
        {
          type: 'textarea',
          name: 'certificate',
          placeholder: helptext_system_ca.edit.certificate.placeholder,
          readonly: true,
        },
        {
          type: 'textarea',
          name: 'privatekey',
          placeholder: helptext_system_ca.edit.privatekey.placeholder,
          readonly: true,
        },
      ],
    },
  ];

  private pk: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService) {}

  preInit() {
    this.route.params.subscribe((params) => {
      if (params['pk']) {
        // fixme: entity-form should do this automatically but the logic appears broken
        // and i don't know what fixing it will break, tbf after release
        this.queryCallOption[0].push(parseInt(params['pk']));
      }
    });
  }

  afterInit(entityEdit: any) {
    this.route.params.subscribe((params) => {
      if (params['pk']) {
        // see above, this should just be handled properly by entity-form
        this.pk = parseInt(params['pk']);
      }
    });
  }

  customSubmit(value) {
    const payload = {};
    payload['name'] = value.name;

    this.loader.open();
    this.ws.call(this.editCall, [this.pk, payload]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleError(this, res);
      },
    );
  }
}
