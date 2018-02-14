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

import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { DialogService } from 'app/services/dialog.service';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

@Component({
  selector : 'app-volumeunlock-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VolumeCreatekeyFormComponent implements Formconfiguration {

  saveSubmitText = "Create";

  resource_name = 'storage/volume';
  route_success: string[] = [ 'storage', 'volumes'];
  isNew = false;
  isEntity = true;
  entityData = {
    name: "",
    passphrase: "",
    passphrase2: ""
  };
  
  fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'name',
      isHidden: true
    },{
      type : 'input',
      name : 'passphrase',
      placeholder: 'passphrase',
      tooltip: 'Geli Passphrase'
    },{
      type : 'input',
      name : 'passphrase2',
      placeholder: 'passphrase2 must match above',
      tooltip: 'Geli Passphrase must match above'
    }
  ];

  resourceTransformIncomingRestData(data:any): any {
    return data;
  };


  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      protected dialogService: DialogService,
      protected loader: AppLoaderService
  ) {

  }

  afterInit(entityForm: any) {
  
  }

  customSubmit(value) {
    this.loader.open();
    console.log("VALUE", value);
    return this.rest.post(this.resource_name + "/" + value.name + "/keypassphrase/", { body: JSON.stringify({passphrase: value.passphrase, passphrase2: value.passphrase2}) }).subscribe((restPostResp) => {
      console.log("restPostResp", restPostResp);
      this.loader.close();
      this.dialogService.Info("Created Volume Key", "Successfully Created Key to volume " + value.name);

      this.router.navigate(new Array('/').concat(
        ["storage", "volumes"]));
    }, (res) => {
      this.loader.close();
      this.dialogService.errorReport("Error Creating key to volume", res.message, res.stack);
    });
  }
  
}
