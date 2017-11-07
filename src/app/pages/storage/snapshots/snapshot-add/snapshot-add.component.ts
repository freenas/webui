import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren,
  AfterViewInit
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';

@Component({
   selector : 'app-snapshot-add',
   templateUrl : './snapshot-add.component.html'})

export class SnapshotAddComponent implements AfterViewInit {
  

  protected resource_name: string = 'storage/snapshot';
  protected route_success: string[] = [ 'storage', 'snapshots' ];
  protected isEntity = true;
  protected isNew = true;
  protected fieldConfig: FieldConfig[] = [];
  public initialized = true;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {

                this.fieldConfig = [
                  {
                    type: 'select',
                    name: 'filesystem',
                    placeholder: 'Volume/Dataset',
                    options: []
                  },
                  {
                    type: 'input', 
                    name: 'id', 
                    placeholder: 'Snapshot Name'
                  },
                  {
                    type: 'input', 
                    name: 'fullname', 
                    placeholder: 'Snapshot Full Name'
                  },
                  {
                    type: 'checkbox',
                    name : 'recursive',
                    placeholder: 'Recursive'
                  },
                ];


  }

  ngAfterViewInit(): void {

    
  this.rest.get("storage/volume/", {}).subscribe((res)=>{
      let rows = new EntityUtils().flattenData(res.data);

      rows.forEach((dataItem)=>{
         let calculatedPath = dataItem.name;

         if( typeof(dataItem.path) !== "undefined" && dataItem.path.length > 0 ) {
            calculatedPath += "/" + dataItem.path;
         }

         this.fieldConfig[0].options.push({
             label:  calculatedPath,
             value:  calculatedPath
         });
       })

       this.initialized = true;
   });
  }
}
