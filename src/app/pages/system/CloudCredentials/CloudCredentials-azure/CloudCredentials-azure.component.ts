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
import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-cloudcredentials-amazon',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class CloudCredentialsAzureComponent {

  protected isEntity: boolean = true;
  protected addCall = 'backup.credential.create';
  protected queryCall = 'backup.credential.query';
  public formGroup: FormGroup;
  protected route_success: string[] = ['system', 'cloudcredentials'];
  protected pk: any;
  protected queryPayload = [];
  protected fieldConfig: FieldConfig[] = [
  {
    type : 'input',
    name : 'provider',
    placeholder : 'azure',
    value: 'AZURE',
    isHidden: true
  },
  {
    type : 'input',
    name : 'name',
    placeholder : 'Name',
  },
  {
    type : 'input',
    name : 'account_name',
    placeholder : 'Account Name',
  },
  {
    type : 'textarea',
    name : 'account_key',
    placeholder :  'Account Key',
  },
];

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {}

  preInit(entityForm: any) {
    if (!entityForm.isNew) {
    this.route.params.subscribe(params => {
      this.queryPayload.push("id")
      this.queryPayload.push("=")
      this.queryPayload.push(parseInt(params['pk']));
      this.pk = [this.queryPayload];
    });
  }
  }
  afterInit(entityForm: any) {
    entityForm.submitFunction = this.submitFunction;
  }
  submitFunction(){
    const auxPayLoad = []
    const payload = {};
    const formvalue = _.cloneDeep(this.formGroup.value);
    payload['provider'] = formvalue.provider;
    payload['name'] = formvalue.name;
    payload['attributes'] = { 'account_key': formvalue.account_key, 'account_name': formvalue.account_name };
    if (!this.pk){
      auxPayLoad.push(payload)
      return this.ws.call('backup.credential.create', auxPayLoad);
    }
    else {
      return this.ws.call('backup.credential.update', [this.pk, payload]);
    }
    

  }
  dataHandler(entityForm: any){
    if (typeof entityForm.wsResponseIdx === "object"){
      if (entityForm.wsResponseIdx.hasOwnProperty('account_key')){
        entityForm.wsfg.setValue(entityForm.wsResponseIdx.accesskey);
      } else if (entityForm.wsResponseIdx.hasOwnProperty('account_name')){
        entityForm.wsfg.setValue(entityForm.wsResponseIdx.secretkey);
      }
    }
    else {
      entityForm.wsfg.setValue(entityForm.wsResponseIdx);
    }
  }
  dataAttributeHandler(entityForm: any){
    const formvalue = _.cloneDeep(entityForm.formGroup.value);
    if (typeof entityForm.wsResponseIdx === "object"){
      for (let flds in entityForm.wsResponseIdx){
        if (flds === 'account_key'){
          entityForm.formGroup.controls['account_key'].setValue(entityForm.wsResponseIdx.account_key);
        } else if (flds === 'account_name'){
          entityForm.formGroup.controls['account_name'].setValue(entityForm.wsResponseIdx.account_name);
         }
      }
    }
  }
}
