import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren,
  AfterViewInit
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import { RestService, WebSocketService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { Formconfiguration } from '../../../common/entity/entity-form/entity-form.component';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-snapshot-add',
  templateUrl: './snapshot-add.component.html'
})

export class SnapshotAddComponent implements AfterViewInit, Formconfiguration {


  public resource_name: string = 'storage/snapshot';
  public route_success: string[] = ['storage', 'snapshots'];
  public isEntity = true;
  public isNew = true;
  public fieldConfig: FieldConfig[] = [];
  public initialized = true;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {

    this.fieldConfig = [
      {
        type: 'select',
        name: 'dataset',
        placeholder: T('Pool/Dataset'),
        tooltip: T('Select an existing ZFS pool, dataset, or zvol.'),
        options: [],
        validation: [Validators.required],
        required: true
      },
      {
        type: 'input',
        name: 'name',
        placeholder: 'Name',
        tooltip: T('Add a name for the new snapshot'),
        options: [],
        validation: [Validators.required],
        required: true
      },
      {
        type: 'checkbox',
        name: 'recursive',
        placeholder: 'Recursive',
        tooltip: T('Set to include child datasets of the chosen dataset.'),
      }
    ];


  }

  ngAfterViewInit(): void {


    this.rest.get("storage/volume/", {}).subscribe((res) => {
      const rows = new EntityUtils().flattenData(res.data);

      rows.forEach((dataItem) => {
        if (typeof (dataItem.path) !== 'undefined' && dataItem.path.length > 0) {
          this.fieldConfig[0].options.push({
            label: dataItem.path,
            value: dataItem.path
          });
        }
      })

      this.initialized = true;
    });
  }
}
