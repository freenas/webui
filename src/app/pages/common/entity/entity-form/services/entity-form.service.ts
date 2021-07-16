import { Inject, Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';
import * as _ from 'lodash';
import { FieldType } from 'app/pages/common/entity/entity-form/components/dynamic-field/dynamic-field.directive';
import { WebSocketService } from 'app/services/ws.service';
import { FieldConfig, UnitType, InputUnitConfig } from '../models/field-config.interface';

@Injectable()
export class EntityFormService {
  durationRegex = /^\s*((MINUTE|HOUR|DAY|WEEK|MONTH|YEAR){1}(S)?)|((M|h|d|w|m|y){1})\s*$/;
  sizeRegex = /^\s*(KIB|MIB|GIB|TIB|PIB|KB|MB|GB|TB|PB|K|M|G|T|P){1}\s*$/;

  shortDurationUnit = {
    M: 'MINUTE',
    h: 'HOUR',
    d: 'DAY',
    w: 'WEEK',
    m: 'MONTH',
    y: 'YEAR',
  };

  defaultUnit = {
    size: 'KIB',
    duration: 'MINUTE',
  };
  constructor(
    @Inject(FormBuilder) private formBuilder: FormBuilder,
    protected ws: WebSocketService,
  ) {}

  createFormGroup(controls: FieldConfig[]): FormGroup {
    const formGroup: { [id: string]: AbstractControl } = {};

    if (controls) {
      for (let i = 0; i < controls.length; i++) {
        const formControl = this.createFormControl(controls[i]);

        if (formControl) {
          formGroup[controls[i].name] = formControl;
        }
        controls[i].relation = Array.isArray(controls[i].relation) ? controls[i].relation : [];
      }
    }

    return this.formBuilder.group(formGroup);
  }

  createFormControl(fieldConfig: FieldConfig): AbstractControl {
    let formControl: AbstractControl;

    if (fieldConfig) {
      if (fieldConfig.formarray) {
        if (fieldConfig.initialCount == null) {
          fieldConfig.initialCount = 1;
        }
        formControl = this.createFormArray(fieldConfig.formarray, fieldConfig.initialCount);
      } else if (fieldConfig.listFields) {
        formControl = this.formBuilder.array([]);
        fieldConfig.listFields.forEach((listField) => {
          (formControl as FormArray).push(this.createFormGroup(listField));
        });
      } else if (fieldConfig.subFields) {
        formControl = this.createFormGroup(fieldConfig.subFields);
      } else if (fieldConfig.type != 'label') {
        formControl = new FormControl(
          { value: fieldConfig.value, disabled: fieldConfig.disabled },
          fieldConfig.type === 'input-list' as FieldType ? [] : fieldConfig.validation, fieldConfig.asyncValidation,
        );
      }
    }

    return formControl;
  }

  createFormArray(controls: FieldConfig[], initialCount: number): FormArray {
    const formArray = this.formBuilder.array([]);

    for (let i = 0; i < initialCount; i++) {
      const subFormGroup = this.createFormGroup(controls);
      formArray.push(subFormGroup);
    }
    return formArray;
  }

  insertFormArrayGroup(index: number, formArray: FormArray, controls: FieldConfig[]): void {
    const formGroup = this.createFormGroup(controls);
    formArray.insert(index, formGroup);
  }

  removeFormArrayGroup(index: number, formArray: FormArray): void {
    formArray.removeAt(index);
  }

  getFilesystemListdirChildren(
    node: any,
    explorerType?: string,
    hideDirs?: string,
    showHiddenFiles = false,
  ): Promise<any[]> {
    const children: any[] = [];
    let typeFilter: any;
    explorerType && explorerType === 'directory' ? typeFilter = [['type', '=', 'DIRECTORY']] : typeFilter = [];

    return this.ws.call('filesystem.listdir', [node.data.name, typeFilter,
      { order_by: ['name'], limit: 1000 }]).toPromise().then((res) => {
      res = _.sortBy(res, (o) => o.name.toLowerCase());

      for (let i = 0; i < res.length; i++) {
        const child: any = {};
        if (!showHiddenFiles) {
          if (res[i].hasOwnProperty('name') && !res[i].name.startsWith('.')) {
            if (res[i].type === 'SYMLINK') {
              continue;
            }
            if (res[i].name !== hideDirs) {
              child['name'] = res[i].path;
              child['acl'] = res[i].acl;
              if (res[i].type === 'DIRECTORY') {
                child['hasChildren'] = true;
              }
              child['subTitle'] = res[i].name;
              children.push(child);
            }
          }
        } else if (res[i].hasOwnProperty('name')) {
          if (res[i].type === 'SYMLINK') {
            continue;
          }
          if (res[i].name !== hideDirs) {
            child['name'] = res[i].path;
            if (res[i].type === 'DIRECTORY') {
              child['hasChildren'] = true;
            }
            child['subTitle'] = res[i].name;
            children.push(child);
          }
        }
      }
      if (children.length === 0) {
        node.data.hasChildren = false;
      }
      return children;
    });
  }

  getDatasetsAndZvolsListChildren(): void {

    // if we ever need this we should convert to websocket
    /* return this.rest.get('storage/volume/', {}).toPromise().then(res => {
      res.data.forEach((vol) => {
        children.push(vol.children[0]);
      });
      return children;
    }); */
  }

  getPoolDatasets(param: any[] = []): Promise<any[]> {
    const nodes: any[] = [];
    return this.ws.call('pool.filesystem_choices', param).toPromise().then((res) => {
      for (let i = 0; i < res.length; i++) {
        const pathArr = res[i].split('/');
        if (pathArr.length === 1) {
          const node = {
            name: res[i],
            subTitle: pathArr[0],
            hasChildren: false,
            children: [] as any,
          };
          nodes.push(node);
        } else {
          let parent = _.find(nodes, { name: pathArr[0] });
          let j = 1;
          while (_.find(parent.children, { subTitle: pathArr[j] })) {
            parent = _.find(parent.children, { subTitle: pathArr[j++] });
          }
          const node = {
            name: res[i],
            subTitle: pathArr[j],
            hasChildren: false,
            children: [] as any,
          };
          parent.children.push(node);
          parent.hasChildren = true;
        }
      }
      return nodes;
    });
  }

  clearFormError(fieldConfig: any[]): void {
    for (let f = 0; f < fieldConfig.length; f++) {
      fieldConfig[f]['errors'] = '';
      fieldConfig[f]['hasErrors'] = false;
    }
  }

  phraseInputData(value: any, config: InputUnitConfig): any {
    if (!value) {
      return value;
    }
    let num = 0;
    let unit = '';

    value = value.replace(/\s+/g, '');

    // get leading number
    let match = [];
    if (config.decimal === undefined || config.decimal) {
      match = value.match(/^(\d+(\.\d+)?)/);
    } else {
      match = value.match(/^(\d+)/);
    }

    if (match && match.length > 0) {
      num = match[1];
    } else {
      return NaN;
    }

    // get unit and return phrased string
    unit = value.replace(num, '');
    if (unit === '') {
      unit = config.default
        ? config.default
        : (config.allowUnits
          ? config.allowUnits[0]
          : this.defaultUnit[config.type]);
    }
    if (config.allowUnits !== undefined) {
      config.allowUnits.forEach((item) => item.toUpperCase());
    }
    // do uppercase except when type is duration and unit is only one character (M is for minutes while m is for month)
    unit = (config.type === UnitType.Size || unit.length > 1) ? unit.toUpperCase() : unit;
    const matchUnits = unit.match(config.type === UnitType.Size ? this.sizeRegex : this.durationRegex);

    if (matchUnits && matchUnits[0] === unit) {
      const humanReableUnit = this.getHumanReadableUnit(num, unit, config.type);
      if (config.allowUnits) {
        const singleUnit = _.endsWith(humanReableUnit, 'S') ? humanReableUnit.substring(0, humanReableUnit.length - 1) : humanReableUnit;
        if (_.indexOf(config.allowUnits, singleUnit) < 0) {
          return NaN;
        }
      }
      return num + ' ' + humanReableUnit;
    }
    return NaN;
  }

  getHumanReadableUnit(num: number, unit: string, type: UnitType): string {
    if (type === UnitType.Duration) {
      let readableUnit = unit.length > 1 ? unit : (this.shortDurationUnit as any)[unit];
      if (num <= 1 && _.endsWith(readableUnit, 'S')) {
        readableUnit = readableUnit.substring(0, readableUnit.length - 1);
      } else if (num > 1 && !_.endsWith(readableUnit, 'S')) {
        readableUnit += 'S';
      }
      return readableUnit;
    }
    if (type === UnitType.Size) {
      return unit[0] + 'iB';
    }
  }
}
