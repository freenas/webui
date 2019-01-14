import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Rx';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';

import {RestService, WebSocketService} from '../../../../services/';
import { T } from '../../../../translate-marker';
import {EntityUtils} from '../../../common/entity/utils';

import { debug } from 'util';

@Component({
   selector : 'bootenv-attach-form',
   template : `<entity-form [conf]="this"></entity-form>`
})

export class BootEnvAttachFormComponent {
  protected route_success: string[] = [ 'system', 'bootenv', 'status' ];
  protected isEntity: boolean = true;
  protected addCall = 'boot.attach';
  protected pk: any;
  protected isNew: boolean = true;
  protected dialogRef: any;


  protected entityForm: any;

  public fieldConfig: FieldConfig[] =[
    {
      type: 'select',
      name: 'dev',
      placeholder: T('Member Disk'),
      tooltip : T('Select the device to attach.'),
      options :[]
    },
    {
      type: 'checkbox',
      name: 'expand',
      placeholder: T('Use all disk space'),
      tooltip : T('Gives control of how much of the new device is made\
                   available to ZFS. Set to use the entire capacity of\
                   the new device.'),
    },

  ]
  protected diskChoice: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected dialog: MatDialog, public snackBar: MatSnackBar,) {}

preInit(entityForm: any) {
  this.route.params.subscribe(params => {
    this.pk = params['pk'];
  });
  this.entityForm = entityForm;
}

  afterInit(entityForm: any) {
    let disksize = 0
    this.entityForm = entityForm;
    this.diskChoice = _.find(this.fieldConfig, {'name':'dev'});
    this.ws.call('disk.get_unused').subscribe((res)=>{
      res.forEach((item) => {
        const disk_name = item.name
        disksize = (<any>window).filesize(item['size'], { standard: "iec" });
        item.name = `${item.name} (${disksize})`;
        this.diskChoice.options.push({label : item.name, value : disk_name});        
      });
    });

  }
  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action , {
      duration: 5000
    });
  }
  customSubmit(entityForm){
    const payload = {};
    payload['expand'] = entityForm.expand;
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Attach Device" }, disableClose: true });
    this.dialogRef.componentInstance.progressNumberType = "nopercent";
    this.dialogRef.componentInstance.setDescription("Attaching Device...");
    this.dialogRef.componentInstance.setCall('boot.attach', [entityForm.dev, payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialogRef.close(false);
      this.openSnackBar("Device attached.", "Success");
      this.router.navigate(
        new Array('').concat('system','bootenv')
      );
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogRef.componentInstance.setDescription(res.error);
    });
  }

}
