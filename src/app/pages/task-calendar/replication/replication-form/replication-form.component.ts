import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef,
  ElementRef,
  AfterViewInit
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
import {RestService, WebSocketService} from '../../../../services/';
import { DialogService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { ReplicationService } from 'app/pages/task-calendar/replication/replication.service';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

@Component({
  selector : 'app-replication-form',
  templateUrl : './replication-form.component.html' 
})
export class ReplicationFormComponent implements AfterViewInit {
  
  protected resource_name = 'storage/replication';
  protected route_success: string[] = [ 'tasks', 'replication'];
  protected isNew = false;
  protected isEntity = true;
  public initialized = false;
  protected entityForm: EntityFormComponent;
  private subscription;
  
  private times = [
    {label : '00:00:00', value : '00:00:00'}, 
    {label : '00:15:00', value : '00:15:00'}, 
    {label : '00:30:00', value : '00:35:00'}, 
    {label : '00:45:00', value : '00:45:00'},
    {label : '01:00:00', value : '01:00:00'}, 
    {label : '01:15:00', value : '01:15:00'}, 
    {label : '01:30:00', value : '01:35:00'}, 
    {label : '01:45:00', value : '01:45:00'},
    {label : '02:00:00', value : '02:00:00'}, 
    {label : '02:15:00', value : '02:15:00'}, 
    {label : '02:30:00', value : '02:35:00'}, 
    {label : '02:45:00', value : '02:45:00'},
    {label : '03:00:00', value : '03:00:00'}, 
    {label : '03:15:00', value : '03:15:00'}, 
    {label : '03:30:00', value : '03:35:00'}, 
    {label : '03:45:00', value : '03:45:00'},
    {label : '04:00:00', value : '04:00:00'}, 
    {label : '04:15:00', value : '04:15:00'}, 
    {label : '04:30:00', value : '04:35:00'}, 
    {label : '04:45:00', value : '04:45:00'},
    {label : '05:00:00', value : '05:00:00'}, 
    {label : '05:15:00', value : '05:15:00'}, 
    {label : '05:30:00', value : '05:35:00'}, 
    {label : '05:45:00', value : '05:45:00'},
    {label : '06:00:00', value : '06:00:00'}, 
    {label : '06:15:00', value : '06:15:00'}, 
    {label : '06:30:00', value : '06:35:00'}, 
    {label : '06:45:00', value : '06:45:00'},
    {label : '07:00:00', value : '07:00:00'}, 
    {label : '07:15:00', value : '07:15:00'}, 
    {label : '07:30:00', value : '07:35:00'}, 
    {label : '07:45:00', value : '07:45:00'},
    {label : '08:00:00', value : '08:00:00'}, 
    {label : '08:15:00', value : '08:15:00'}, 
    {label : '08:30:00', value : '08:35:00'}, 
    {label : '08:45:00', value : '08:45:00'},
    {label : '09:00:00', value : '09:00:00'}, 
    {label : '09:15:00', value : '09:15:00'}, 
    {label : '09:30:00', value : '09:35:00'}, 
    {label : '09:45:00', value : '09:45:00'},
    {label : '10:00:00', value : '10:00:00'}, 
    {label : '10:15:00', value : '10:15:00'}, 
    {label : '10:30:00', value : '10:35:00'}, 
    {label : '10:45:00', value : '10:45:00'},
    {label : '11:00:00', value : '11:00:00'}, 
    {label : '11:15:00', value : '11:15:00'}, 
    {label : '11:30:00', value : '11:35:00'}, 
    {label : '11:45:00', value : '11:45:00'},
    {label : '12:00:00', value : '12:00:00'}, 
    {label : '12:15:00', value : '12:15:00'}, 
    {label : '12:30:00', value : '12:35:00'}, 
    {label : '12:45:00', value : '12:45:00'},
    {label : '13:00:00', value : '13:00:00'}, 
    {label : '13:15:00', value : '13:15:00'}, 
    {label : '13:30:00', value : '13:35:00'}, 
    {label : '13:45:00', value : '13:45:00'},
    {label : '14:00:00', value : '14:00:00'}, 
    {label : '14:15:00', value : '14:15:00'}, 
    {label : '14:30:00', value : '14:35:00'}, 
    {label : '14:45:00', value : '14:45:00'},
    {label : '15:00:00', value : '15:00:00'}, 
    {label : '15:15:00', value : '15:15:00'}, 
    {label : '15:30:00', value : '15:35:00'}, 
    {label : '15:45:00', value : '15:45:00'},
    {label : '16:00:00', value : '16:00:00'}, 
    {label : '16:15:00', value : '16:15:00'}, 
    {label : '16:30:00', value : '16:35:00'}, 
    {label : '16:45:00', value : '16:45:00'},
    {label : '17:00:00', value : '17:00:00'}, 
    {label : '17:15:00', value : '17:15:00'}, 
    {label : '17:30:00', value : '17:35:00'}, 
    {label : '17:45:00', value : '17:45:00'},
    {label : '18:00:00', value : '18:00:00'}, 
    {label : '18:15:00', value : '18:15:00'}, 
    {label : '18:30:00', value : '18:35:00'}, 
    {label : '18:45:00', value : '18:45:00'},
    {label : '19:00:00', value : '19:00:00'}, 
    {label : '19:15:00', value : '19:15:00'}, 
    {label : '19:30:00', value : '19:35:00'}, 
    {label : '19:45:00', value : '19:45:00'},
    {label : '20:00:00', value : '20:00:00'}, 
    {label : '20:15:00', value : '20:15:00'}, 
    {label : '20:30:00', value : '20:35:00'}, 
    {label : '20:45:00', value : '20:45:00'},
    {label : '21:00:00', value : '21:00:00'}, 
    {label : '21:15:00', value : '21:15:00'}, 
    {label : '21:30:00', value : '21:35:00'}, 
    {label : '21:45:00', value : '21:45:00'},
    {label : '22:00:00', value : '22:00:00'}, 
    {label : '22:15:00', value : '22:15:00'}, 
    {label : '22:30:00', value : '22:35:00'}, 
    {label : '22:45:00', value : '22:45:00'},
    {label : '23:00:00', value : '23:00:00'}, 
    {label : '23:15:00', value : '23:15:00'}, 
    {label : '23:30:00', value : '23:35:00'}, 
    {label : '23:45:00', value : '23:45:00'},
    {label : '23:59:00', value : '23:59:00'},
  ];
  
  private repl_remote_dedicateduser: any;
  protected fieldConfig: FieldConfig[];

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected replicationService: ReplicationService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      private dialog:DialogService,
      protected loader: AppLoaderService,
  ) {
    
    const theThis = this;

    


    this.fieldConfig =
    [
      {
        type: 'select',
        name: 'repl_filesystem',
        placeholder: 'Volume/Dataset',
        options: [],
        validation: Validators.required
      },
      {
        type: 'input',
        name: 'repl_zfs',
        placeholder: "Remote ZFS Volume/Dataset",
        validation: Validators.required
      },
      {
        type : 'checkbox',
        name : 'repl_userepl',
        placeholder : 'Recursively Replicate Child Dataset Snapshot(s)',
        value: false
      },
      {
        type : 'checkbox',
        name : 'repl_followdelete',
        placeholder : 'Delete Stale Snapshots on Remote System',
        value: false
      },
      { 
        type: 'select',
        name: 'repl_compression',
        placeholder: 'Replication Stream Compression',
        options : [
          {label : 'Off', value : 'off'}, 
          {label : 'lz4 (fastest)', value : 'lz4'},
          {label : 'pigz (all rounder)', value : 'pigz'},
          {label : 'plzip (best compression)', value : 'plzip'}
        ]
      },
      { 
        type: 'input',
        name: 'repl_limit',
        placeholder: 'Limit (KB/s)',
        inputType: 'number', 
        value: 0,
        validation: [Validators.min(0)]
      },
      {
        type: 'select',
        name: 'repl_begin',
        placeholder: 'Begin Time',
        options : this.times
      },
      {
        type: 'select',
        name: 'repl_end',
        placeholder: 'End Time',
        options : this.times
      },
      {
        type : 'checkbox',
        name : 'repl_enabled',
        placeholder : 'Enabled',
        value: true
      },
      {
        type : 'select',
        name : 'repl_remote_mode',
        placeholder : 'Remote Mode',
        options : [
          {label : 'Manual', value : 'MANUAL'}, 
          {label : 'Semi-Automatic', value : 'SEMIAUTOMATIC'}
        ],
        isHidden: false
      }, 
      {
        type : 'input',
        name : 'repl_remote_hostname',
        placeholder : 'Remote Hostname',
        validation: Validators.required
      },
      {
        type : 'input',
        name : 'repl_remote_port',
        placeholder : 'Remote Port',
        inputType: 'number',
        value : 22,
        validation: [Validators.min(0)],
        isHidden: false
      },
      {
        type : 'input',
        name : 'repl_remote_http_port',
        placeholder : 'Remote HTTP/HTTPS Port',
        inputType: 'number',
        value : 80,
        validation: [Validators.min(0)],
        isHidden: true,
      },
      {
        type : 'checkbox',
        name : 'repl_remote_https',
        placeholder : 'Remote HTTPS',
        isHidden: true,
      },
      {
        type : 'input',
        name : 'repl_remote_token',
        placeholder : 'Remote Auth Token',
        isHidden: true,
      },
      {
        type : 'select',
        name : 'repl_remote_cipher',
        placeholder : 'Remote Cipher',
        options : [
          {label : 'standard', value : 'standard'}, 
          {label : 'fast', value : 'fast'},
          {label : 'disabled', value : 'disabled'}
        ]
      },
      {
        type: 'checkbox',
        name: 'repl_remote_dedicateduser_enabled',
        placeholder: 'Dedicated User Enabled',
    },
      {
        type: 'select',
        name: 'repl_remote_dedicateduser',
        placeholder: 'Dedicated User',
        options: [],
        relation:[ {
          action: "DISABLE", 
          when:[ {name:'repl_remote_dedicateduser_enabled', value: false }]
        } ]
      },
      {
        type: 'textareabutton',
        name: 'repl_remote_hostkey',
        placeholder: 'Remote Hostkey',
        customEventActionLabel: 'Scan SSH Key',
        customEventMethod: function(data) {
          theThis.customEventMethod(data);
        },
        isHidden: false
      },
    ];
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.subscription = entityForm.formGroup.controls['repl_remote_mode'].valueChanges.subscribe((res) => {
      if (res === 'SEMIAUTOMATIC'){
        _.find(this.fieldConfig, {'name' : 'repl_remote_port'}).isHidden = true;
        _.find(this.fieldConfig, {'name' : 'repl_remote_hostkey'}).isHidden = true;
        _.find(this.fieldConfig, {'name' : 'repl_remote_http_port'}).isHidden = false;
        _.find(this.fieldConfig, {'name' : 'repl_remote_https'}).isHidden = false;
        _.find(this.fieldConfig, {'name' : 'repl_remote_token'}).isHidden = false;
      } else {
        _.find(this.fieldConfig, {'name' : 'repl_remote_port'}).isHidden = false;
        _.find(this.fieldConfig, {'name' : 'repl_remote_hostkey'}).isHidden = false;
        _.find(this.fieldConfig, {'name' : 'repl_remote_http_port'}).isHidden = true;
        _.find(this.fieldConfig, {'name' : 'repl_remote_https'}).isHidden = true;
        _.find(this.fieldConfig, {'name' : 'repl_remote_token'}).isHidden = true;
         
      }

    });
    if (entityForm.isNew){
      entityForm.formGroup.controls['repl_remote_mode'].setValue('MANUAL');
      entityForm.formGroup.controls['repl_begin'].setValue('00:00:00');
      entityForm.formGroup.controls['repl_end'].setValue('23:59:00');
      entityForm.formGroup.controls['repl_remote_cipher'].setValue('standard');
      entityForm.formGroup.controls['repl_compression'].setValue('lz4');
    }
    else {
      _.find(this.fieldConfig, {'name' : 'repl_remote_mode'}).isHidden = true;
      this.rest.get(this.resource_name, {}).subscribe((res)=>{
        for (const key in entityForm.data){
          if (key === 'repl_remote_port'){
            _.find(this.fieldConfig, {'name' : 'repl_remote_http_port'}).isHidden = true;
            _.find(this.fieldConfig, {'name' : 'repl_remote_https'}).isHidden = true;
          }
        }
      });
    }
    this.repl_remote_dedicateduser = _.find(this.fieldConfig, {'name' : 'repl_remote_dedicateduser'});
    this.ws.call('user.query').subscribe((res)=>{
      res.forEach((item) => {
        this.repl_remote_dedicateduser.options.push({label : item.username, value : item.username})
      });
    })
  }

  ngAfterViewInit() {

    // Get snapshots for repl_filesystem this.fieldConfig[0]
    this.rest.get("storage/task", {}).subscribe((res)=>{
       res.data.forEach((dataItem)=>{
          this.fieldConfig[0].options.push({
              label:  dataItem.task_filesystem,
              value:  dataItem.task_filesystem
          });
        })

        this.initialized = true;
    });
  }

  customEventMethod( data: any ) {
    const textAreaSSH: ElementRef = (<ElementRef>data.textAreaSSH);
    const hostName: string = this.entityForm.value.repl_remote_hostname;
    const port: number = Number(this.entityForm.value.repl_remote_port);
    this.loader.open();
    this.replicationService.getSSHKeyscan( hostName, port).subscribe((sshKeyData)=>{
      this.loader.close();
      textAreaSSH.nativeElement.value = sshKeyData;
      this.entityForm.formGroup.controls.repl_remote_hostkey.setValue(sshKeyData);
    },
    (sshError) => {
      this.loader.close();
      this.dialog.errorReport(sshError.error, sshError.reason, sshError.trace.formatted);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
