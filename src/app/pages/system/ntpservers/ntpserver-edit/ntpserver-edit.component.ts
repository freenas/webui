import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { RestService } from '../../../../services/rest.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-ntpserver-edit',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class NTPServerEditComponent {

  protected resource_name: string = 'system/ntpserver/';
  protected route_success: string[] = ['system', 'ntpservers'];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'ntp_address',
      placeholder: T('Address'),
      tooltip: T('Enter the hostname or IP address of the <b>NTP</b> server.'),
    },
    {
      type: 'checkbox',
      name: 'ntp_burst',
      placeholder: T('Burst'),
      tooltip: T('Recommended when <i>Max. Poll</i> is greater\
       than 10; only use on your own servers i.e. do not use with\
       a public NTP server.'),
    },
    {
      type: 'checkbox',
      name: 'ntp_iburst',
      placeholder: T('IBurst'),
      tooltip: T('Speeds the initial synchronization\
       (seconds instead of minutes).'),
    },
    {
      type: 'checkbox',
      name: 'ntp_prefer',
      placeholder: T('Prefer'),
      tooltip: T('Should only be used for <b>NTP</b> servers known to\
       be highly accurate, such as those with time monitoring hardware.'),
    },
    {
      type: 'input',
      name: 'ntp_minpoll',
      placeholder: T('Min. Poll'),
      inputType: 'number',
      validation: [Validators.required, Validators.min(0)],
      tooltip: T('Power of 2 in seconds; cannot be lower than 4 or\
       higher than <i>Max. Poll</i> which is 17.'),
    },
    {
      type: 'input',
      name: 'ntp_maxpoll',
      placeholder: T('Max. Poll'),
      inputType: 'number',
      validation: [Validators.required, Validators.min(0)],
      tooltip: T('Power of 2 in seconds; cannot be higher than 17 or\
       lower than <i>Min. Poll</i>.'),
    },
    {
      type: 'checkbox',
      name: 'force',
      placeholder: T('Force'),
      tooltip: T('Forces the addition of the <b>NTP</b> server,\
       even if it is currently unreachable.'),
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService) {}

  afterInit(entityEdit) {}
}
