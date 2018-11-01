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
import { MatSnackBar } from '@angular/material';
import * as _ from 'lodash';

import {RestService, WebSocketService, StorageService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { DialogService } from 'app/services/dialog.service';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-addkey-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VolumeAddkeyFormComponent implements Formconfiguration {

  saveSubmitText = T("Add Recovery Key");

  resource_name = 'storage/volume';
  route_success: string[] = [ 'storage', 'pools'];
  isNew = false;
  isEntity = true;
  entityData = {
    name: "",
    passphrase: ""
  };

  fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'name',
      isHidden: true,
      validation: [Validators.required],
      required: true
    },{
      type : 'input',
      inputType: 'password',
      name : 'password',
      placeholder: T('Root password'),
      tooltip: T('Enter the root password to authorize this operation.'),
      validation: [Validators.required],
      required: true
    }
  ];

  resourceTransformIncomingRestData(data:any): any {
    return data;
  };

  pk: any;
  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      protected dialogService: DialogService,
      protected loader: AppLoaderService,
      protected storage: StorageService,
      protected snackBar: MatSnackBar
  ) {

  }

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
    });
  }

  afterInit(entityForm: any) {

  }

  customSubmit(value) {
    this.loader.open();
    this.ws.call('auth.check_user', ['root', value.password]).subscribe(res => {
      if (res) {
        this.rest.post(this.resource_name + "/" + this.pk + "/recoverykey/", {}).subscribe((restPostResp) => {
          this.loader.close();
          this.snackBar.open(T("Recovery key added to pool ") + value.name, 'close', { duration: 5000 });
          this.storage.downloadFile('geli_recovery.key', restPostResp.data.content, 'application/octet-stream');
          this.router.navigate(new Array('/').concat(
            this.route_success));
        }, (res) => {
          this.loader.close();
          this.dialogService.errorReport(T("Error adding recovery key to pool."), res.error.error_message, res.error.traceback);
        });
      }
      else {
        this.loader.close();
        this.dialogService.Info(T("Invalid password"), T("Please enter the correct password."));
      }
    }, (res) => {
      this.loader.close();
      this.dialogService.errorReport(res.error, res.reason, res.trace.formatted);
    });
  }

}
