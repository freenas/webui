import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, UserService, WebSocketService } from '../../../services';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-system-dataset',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetComponent implements OnInit{

  protected resource_name: string = 'storage/dataset';
  protected volume_name: string = 'storage/volume';
  public formGroup: FormGroup;

  public fieldConfig: FieldConfig[] = [{
    type: 'select',
    name: 'pool',
    placeholder: T('System Dataset Pool'),
    tooltip: T('Select the ZFS volume (pool) to contain the system\
                dataset. Encrypted volumes are not displayed in the\
                drop down menu. '),
    options: [
      {label: '---', value: null},
      { label: 'freenas-boot', value: 'freenas-boot' },
    ]
  },{
      type: 'checkbox',
      name: 'syslog',
      placeholder: T('Syslog'),
      tooltip : T('Stores the system log on the system\
                   dataset when checked.')
    },{
      type: 'checkbox',
      name: 'rrd',
      placeholder: T('Reporting Database'),
      tooltip : T('Stores the reporting information on the\
                   system dataset when checked. The system will\
                   automatically create a RAM disk to prevent reporting\
                   information from filling up <b>/var</b> if unchecked '),
    }];

  private pool: any;
  private syslog: any;
  private rrd: any;
  constructor(private rest: RestService, private ws: WebSocketService) {}

  ngOnInit() {
    this.rest.get(this.volume_name, {}).subscribe( res => {
       if (res) {
         this.pool = _.find(this.fieldConfig, {'name': 'pool'});
         res.data.forEach( x => {
           this.pool.options.push({ label: x.name, value: x.name});
         });
       }
    });
  }

  afterInit(entityForm: any) {
    this.ws.call('systemdataset.config').subscribe(res => {
      entityForm.formGroup.controls['pool'].setValue(res.pool);
      entityForm.formGroup.controls['syslog'].setValue(res.syslog);
      entityForm.formGroup.controls['rrd'].setValue(res.rrd);
    });

    entityForm.submitFunction = this.submitFunction;
  }

  submitFunction() {
    const payload = {};
    const formvalue = _.cloneDeep(this.formGroup.value);
    payload['pool'] = formvalue.pool;
    payload['syslog'] = formvalue.syslog;
    payload['rrd'] = formvalue.rrd;
    try {
      return this.ws.call('systemdataset.update', [payload]);
    } catch(err) {
      console.log(err);
    }
  }
}
