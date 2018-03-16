import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'system-ca-internal',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class CertificateAuthorityInternalComponent {

  protected resource_name: string = 'system/certificateauthority/internal';
  protected route_success: string[] = [ 'system', 'ca' ];
  protected isEntity: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'cert_name',
      placeholder : T('Identifier'),
      tooltip: T('Enter a descriptive name for the CA using\
       only alphanumeric, underscore (_), and dash (-) characters.'),
    },
    {
      type : 'select',
      name : 'cert_key_length',
      placeholder : T('Key Length'),
      tooltip:T('For security reasons, a minimum of <i>2048</i>\
       is recommended.'),
      options : [
        {label : '1024', value : 1024},
        {label : '2048', value : 2048},
        {label : '4096', value : 4096},
      ],
    },
    {
      type : 'select',
      name : 'cert_digest_algorithm',
      placeholder : T('Digest Algorithm'),
      tooltip: T('The default is acceptable unless your organization\
       requires a different algorithm.'),
      options : [
        {label : 'SHA1', value : 'SHA1'},
        {label : 'SHA224', value : 'SHA224'},
        {label : 'SHA256', value : 'SHA256'},
        {label : 'SHA384', value : 'SHA384'},
        {label : 'SHA512', value : 'SHA512'},
      ],
    },
    {
      type : 'input',
      name : 'cert_lifetime',
      placeholder : T('Lifetime'),
      tooltip: T('The lifetime of the CA is specified in days.'),
      inputType: 'number',
      validation: [Validators.required, Validators.min(0)]
    },
    {
      type : 'select',
      name : 'cert_country',
      placeholder : T('Country'),
      tooltip: T('Select the country for the organization.'),
      options : [
      ],
    },
    {
      type : 'input',
      name : 'cert_state',
      placeholder : T('State'),
      tooltip: T('Enter the state or province of the\
       organization.'),
    },
    {
      type : 'input',
      name : 'cert_city',
      placeholder : T('Locality'),
      tooltip: T('Enter the location of the organization.'),
    },
    {
      type : 'input',
      name : 'cert_organization',
      placeholder : T('Organization'),
      tooltip: T('Enter the name of the company or\
       organization.'),
    },
    {
      type : 'input',
      name : 'cert_email',
      placeholder : T('Email'),
      tooltip: T('Enter the email address for the person\
       responsible for the CA.'),
      validation : [ Validators.email ]
    },
    {
      type : 'input',
      name : 'cert_common',
      placeholder : T('Common Name'),
      tooltip: T('Enter the fully-qualified hostname (FQDN) of the\
       system. This name **must** be unique within a certificate\
       chain.'),
    },
    {
      type : 'textarea',
      name : 'cert_san',
      placeholder: T('Subject Alternate Names'),
      tooltip: T('Multi-domain support. Enter additional space separated domains.')
    }
  ];

  private cert_country: any;

  ngOnInit() {
    this.ws.call('notifier.choices', ['COUNTRY_CHOICES']).subscribe( (res) => {
      // console.log(res);
      this.cert_country = _.find(this.fieldConfig, {'name' : 'cert_country'});
      res.forEach((item) => {
        this.cert_country.options.push(
          { label : item[1], value : item[0]}
        );
      });
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService) {}
}
