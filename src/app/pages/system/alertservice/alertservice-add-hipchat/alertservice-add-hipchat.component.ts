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
  selector : 'app-alertservice-add-hipchat',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceAddHipchatComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = true;
  protected isEntity = true;
  
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'consulalert_type',
      value: 'HipChat',
    },{
      type: 'input',
      name: 'cluster_name',
      placeholder: 'Cluster Name',
      tooltip: 'Enter the name of the cluster.',
    },{
      type: 'input',
      name: 'base_url',
      placeholder: 'Url',
      tooltip: 'Enter the HipChat base URL.',
      value: 'https://api.hipchat.com/v2/'
    },{
      type: 'input',
      name: 'room_id',
      placeholder: 'Room',
      tooltip: 'Enter the name of the room.',
    },{
      type: 'input',
      name: 'auth_token',
      placeholder: 'Auth Token',
      tooltip: 'Paste the Authentication token here.',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      tooltip: 'Check this box to enable the HipChat service.',
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

  afterInit(entityAdd: any) {}
}
