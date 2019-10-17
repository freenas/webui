import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';
import { RestService, WebSocketService, StorageService } from '../../../../../services/';
import { EntityUtils } from '../../../../common/entity/utils';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { Formconfiguration } from '../../../../common/entity/entity-form/entity-form.component';
import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { DialogService } from 'app/services/dialog.service';
import { T } from '../../../../../translate-marker';
import helptext from '../../../../../helptext/storage/volumes/datasets/dataset-form';
import globalHelptext from '../../../../../helptext/global-helptext';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { Validators, ValidationErrors, FormControl } from '@angular/forms';
import { filter } from 'rxjs/operators';

interface DatasetFormData {
  name: string;
  comments: string;
  sync: string;
  compression: string;
  atime: string;
  share_type: string;
  aclmode: string;
  refquota: number;
  refquota_unit?: string;
  quota: number;
  quota_unit?: string;
  refreservation: number;
  refreservation_unit?: string;
  reservation: number;
  reservation_unit?: string;
  deduplication: string;
  exec: string;
  readonly: string;
  snapdir: string;
  copies: string;
  recordsize: string;
  casesensitivity: string;
  quota_warning: number;
  quota_critical: number;
  refquota_warning: number;
  refquota_critical: number;
};

@Component({
  selector: 'app-dataset-form',
  template: '<entity-form [conf]="this"></entity-form>'
})
export class DatasetFormComponent implements Formconfiguration{

  public volid: string;
  public sub: Subscription;
  public route_success: string[] = ['storage', 'pools'];
  public isBasicMode = true;
  public pk: any;
  public customFilter: any[] = [];
  public queryCall = "pool.dataset.query";
  public isEntity = true;
  public isNew = false;
  public parent_dataset: any;
  protected entityForm: any;
  public minimum_recommended_dataset_recordsize = '128K';
  protected recordsize_field: any;
  protected recordsize_fg: any;
  protected recommended_size_number: any;
  protected recordsize_warning: any;
  public namesInUse = [];
  public nameIsCaseInsensitive = false;

  public humanReadable = {'quota': '0', 'refquota': '0', 'reservation': '0', 'refreservation': '0'}

  private quota_subscription;
  private refquota_subscription;
  private reservation_subscription;
  private refreservation_subscription;

  public parent: string;
  public data: any;
  public parent_data: any;

  protected size_fields = ['quota', 'refquota', 'reservation', 'refreservation'];
  protected OrigSize = {};
  protected OrigHuman = {};

  public custActions: Array<any> = [
    {
      id: 'basic_mode',
      name: T('Basic Mode'),
      function: () => { 
        this.isBasicMode = !this.isBasicMode;
        _.find(this.fieldSets, {class:"dataset"}).label = false;
        _.find(this.fieldSets, {class:"refdataset"}).label = false;
      }
    },
    {
      id: 'advanced_mode',
      name: T('Advanced Mode'),
      function: () => { 
        this.isBasicMode = !this.isBasicMode;
        _.find(this.fieldSets, {class:"dataset"}).label = true;
        _.find(this.fieldSets, {class:"refdataset"}).label = true;
      }
    }
  ];


  public fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.dataset_form_name_section_placeholder,
      class: "name",
      label:true,
      config: [
      {
        type: 'input',
        name: 'name',
        placeholder: helptext.dataset_form_name_placeholder,
        tooltip: helptext.dataset_form_name_tooltip,
        readonly: true,
        required: true,
        validation: [Validators.required, forbiddenValues(this.namesInUse, this.nameIsCaseInsensitive)],
      },
      {
        type: 'input',
        name: 'comments',
        placeholder: helptext.dataset_form_comments_placeholder,
        tooltip: helptext.dataset_form_comments_tooltip,
      },
      {
        type: 'select',
        name: 'sync',
        placeholder: helptext.dataset_form_sync_placeholder,
        tooltip: helptext.dataset_form_sync_tooltip,
        options: [
          { label: 'Standard', value: 'STANDARD' },
          { label: 'Always', value: 'ALWAYS' },
          { label: 'Disabled', value: 'DISABLED' }
        ],
      },
      {
        type: 'select',
        name: 'compression',
        placeholder: helptext.dataset_form_compression_placeholder,
        tooltip: helptext.dataset_form_compression_tooltip,
        options: [
          { label: 'off', value: 'OFF' },
          { label: 'lz4 (recommended)', value: 'LZ4' ,},
          { label: 'gzip (fastest)', value: 'GZIP-1' },
          { label: 'gzip (default level, 6)', value: 'GZIP' },
          { label: 'gzip (maximum, slow)', value: 'GZIP-9' },
          { label: 'zle (runs of zeros)', value: 'ZLE' },
          { label: 'lzjb (legacy, not recommended)', value: 'LZJB' }
        ],
      },
      {
        type: 'select',
        name: 'atime',
        placeholder: helptext.dataset_form_atime_placeholder,
        tooltip: helptext.dataset_form_atime_tooltip,
        options: [
          { label: 'on', value: 'ON' },
          { label: 'off', value: 'OFF' }
        ],
      }]
    },
    {
      name: helptext.dataset_form_refdataset_section_placeholder,
      class: "refdataset",
      label:true,
      width:'50%',
      config: [
      {
        type: 'input',
        name: 'refquota',
        placeholder: helptext.dataset_form_refquota_placeholder,
        tooltip: helptext.dataset_form_refquota_tooltip,
        class: 'inline',
        width: '70%',
        value: '0',
        blurEvent:this.blurEventRefQuota,
        blurStatus: true,
        parent: this,
        validation: [
          (control: FormControl): ValidationErrors => {
            const config = this.fieldConfig.find(c => c.name === 'refquota');
            
            const errors = control.value && isNaN(this.convertHumanStringToNum(control.value, 'refquota'))
              ? { invalid_byte_string: true }
              : null

            if (errors) {
              config.hasErrors = true;
              config.errors = globalHelptext.human_readable.input_error;
            } else {
              config.hasErrors = false;
              config.errors = '';
            }

            return errors;
          }
        ],
      },
      {
        type: 'input',
        inputType: 'number',
        name: 'refquota_warning',
        placeholder: helptext.dataset_form_refquota_warning_placeholder,
        tooltip: helptext.dataset_form_refquota_warning_tooltip,
        class: 'inline',
        width: '70%',
        value: 0,
        min: 0,
        validation: helptext.dataset_form_refquota_warning_validation
      },
      {
        type: 'input',
        inputType: 'number',
        name: 'refquota_critical',
        placeholder: helptext.dataset_form_refquota_critical_placeholder,
        tooltip: helptext.dataset_form_refquota_critical_tooltip,
        class: 'inline',
        width: '70%',
        value: 0,
        min: 0,
        validation: helptext.dataset_form_refquota_critical_validation
      },
      {
        type: 'input',
        name: 'refreservation',
        placeholder: helptext.dataset_form_refreservation_placeholder,
        tooltip: helptext.dataset_form_refreservation_tooltip,
        class: 'inline',
        width: '70%',
        value: '0',
        blurEvent: this.blurEventRefReservation,
        blurStatus: true,
        parent: this,
        validation: [
          (control: FormControl): ValidationErrors => {
            const config = this.fieldConfig.find(c => c.name === 'refreservation');
            
            const errors = control.value && isNaN(this.convertHumanStringToNum(control.value, 'refreservation'))
              ? { invalid_byte_string: true }
              : null

            if (errors) {
              config.hasErrors = true;
              config.errors = globalHelptext.human_readable.input_error;
            } else {
              config.hasErrors = false;
              config.errors = '';
            }

            return errors;
          }
        ],
      }],
    },
    {
      name: helptext.dataset_form_dataset_section_placeholder,
      class: "dataset",
      label:true,
      width:'50%',
      config: [
      {
        type: 'input',
        name: 'quota',
        placeholder: helptext.dataset_form_quota_placeholder,
        tooltip: helptext.dataset_form_quota_tooltip,
        class: 'inline',
        width: '70%',
        value: '0',
        blurEvent: this.blurEventQuota,
        blurStatus: true,
        parent: this,
        validation: [
          (control: FormControl): ValidationErrors => {
            const config = this.fieldConfig.find(c => c.name === 'quota');
            
            const errors = control.value && isNaN(this.convertHumanStringToNum(control.value, 'quota'))
              ? { invalid_byte_string: true }
              : null

            if (errors) {
              config.hasErrors = true;
              config.errors = globalHelptext.human_readable.input_error;
            } else {
              config.hasErrors = false;
              config.errors = '';
            }

            return errors;
          }
        ],
      },
      {
        type: 'input',
        inputType: 'number',
        name: 'quota_warning',
        placeholder: helptext.dataset_form_quota_warning_placeholder,
        tooltip: helptext.dataset_form_quota_warning_tooltip,
        class: 'inline',
        width: '70%',
        value: 0,
        min: 0,
        validation: helptext.dataset_form_quota_warning_validation
      },
      {
        type: 'input',
        inputType: 'number',
        name: 'quota_critical',
        placeholder: helptext.dataset_form_quota_critical_placeholder,
        tooltip: helptext.dataset_form_quota_critical_tooltip,
        class: 'inline',
        width: '70%',
        value: 0,
        min: 0,
        validation: helptext.dataset_form_quota_critical_validation
      },
      {
        type: 'input',
        name: 'reservation',
        placeholder: helptext.dataset_form_reservation_placeholder,
        tooltip: helptext.dataset_form_reservation_tooltip,
        class: 'inline',
        width: '70%',
        value: '0',
        blurEvent: this.blurEventReservation,
        blurStatus: true,
        parent: this,
        validation: [
          (control: FormControl): ValidationErrors => {
            const config = this.fieldConfig.find(c => c.name === 'reservation');
            
            const errors = control.value && isNaN(this.convertHumanStringToNum(control.value, 'reservation'))
              ? { invalid_byte_string: true }
              : null

            if (errors) {
              config.hasErrors = true;
              config.errors = globalHelptext.human_readable.input_error;
            } else {
              config.hasErrors = false;
              config.errors = '';
            }

            return errors;
          }
        ],
      }],
    },
    {
      name: helptext.dataset_form_other_section_placeholder,
      class: "options",
      label:true,
      config: [
      {
        type: 'select',
        name: 'deduplication',
        label: helptext.dataset_form_deduplication_label,
        placeholder: helptext.dataset_form_deduplication_placeholder,
        tooltip: helptext.dataset_form_deduplication_tooltip,
        options: [
          { label: 'on', value: 'ON' },
          { label: 'verify', value: 'VERIFY' },
          { label: 'off', value: 'OFF' }
        ],
      },
      {
        type: 'select',
        name: 'readonly',
        placeholder: helptext.dataset_form_readonly_placeholder,
        tooltip: helptext.dataset_form_readonly_tooltip,
        options: [
          { label: 'On', value: 'ON' },
          { label: 'Off', value: 'OFF' }
        ],
      },
      {
        type: 'select',
        name: 'exec',
        placeholder: helptext.dataset_form_exec_placeholder,
        tooltip: helptext.dataset_form_exec_tooltip,
        options: [
          { label: 'On', value: 'ON' },
          { label: 'Off', value: 'OFF' }
        ],
      },
      {
        type: 'select',
        name: 'snapdir',
        placeholder: helptext.dataset_form_snapdir_placeholder,
        tooltip: helptext.dataset_form_snapdir_tooltip,
        options: [
          { label: 'Visible', value: 'VISIBLE' },
          { label: 'Invisible', value: 'HIDDEN' },
        ],
      },
      {
        type: 'select',
        name: 'copies',
        placeholder: helptext.dataset_form_copies_placeholder,
        tooltip: helptext.dataset_form_copies_tooltip,
        options: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' }
        ],
        value: 1
      },
      {
        type: 'select',
        name: 'recordsize',
        placeholder: helptext.dataset_form_recordsize_placeholder,
        tooltip: helptext.dataset_form_recordsize_tooltip,
        options: [
          { label: '512', value: '512', disable:true, hiddenFromDisplay: true },
          { label: '1K', value: '1K', disable:true, hiddenFromDisplay: true },
          { label: '2K', value: '2K', disable:true, hiddenFromDisplay: true },
          { label: '4K', value: '4K' },
          { label: '8K', value: '8K' },
          { label: '16K', value: '16K' },
          { label: '32K', value: '32K' },
          { label: '64K', value: '64K' },
          { label: '128K', value: '128K' },
          { label: '256K', value: '256K' },
          { label: '512K', value: '512K' },
          { label: '1M', value: '1M' }
        ],
      },
      {
        type: 'select',
        name: 'aclmode',
        placeholder: helptext.dataset_form_aclmode_placeholder,
        tooltip: helptext.dataset_form_aclmode_tooltip,
        options: [{label:'Passthrough', value: 'PASSTHROUGH'},
                  {label:'Restricted', value: 'RESTRICTED'}],
        value: 'PASSTHROUGH'
      },
      {
        type: 'select',
        name: 'casesensitivity',
        placeholder: helptext.dataset_form_casesensitivity_placeholder,
        tooltip: helptext.dataset_form_casesensitivity_tooltip,
        options: [
          { label: 'Sensitive', value: 'SENSITIVE' },
          { label: 'Insensitive', value: 'INSENSITIVE' },
          { label: 'Mixed', value: 'MIXED' }
        ],
        value: 'SENSITIVE'
      },
      {
        type: 'select',
        name: 'share_type',
        placeholder: helptext.dataset_form_share_type_placeholder,
        tooltip: helptext.dataset_form_share_type_tooltip,
        options: [{label:'Generic', value: 'GENERIC'},
                  {label:'SMB', value: 'SMB'}],
        value: 'GENERIC',
        disabled: true,
        isHidden: true,
      }]
    }
  ];

  public advanced_field: Array<any> = [
    'refquota',
    'quota',
    'quota_unit',
    'refreservation',
    'reservation',
    'readonly',
    'snapdir',
    'copies',
    'recordsize',
    'exec',
    'quota_warning',
    'quota_critical',
    'refquota_warning',
    'refquota_critical',
    'aclmode'

  ];

  protected byteMap: Object= {
    'T': 1099511627776,
    'G': 1073741824,
    'M': 1048576,
    'K': 1024,
    'B': 1
  };
  protected recordSizeMap: Object= {
    '512': '512',
    '1024': '1K',
    '2048': '2K',
    '4096': '4K',
    '8192': '8K',
    '16384': '16K',
    '32768':'32K',
    '65536': '64K',
    '131072': '128K',
    '262144': '256K',
    '524288': '512K',
    '1048576': '1024K',
  };
  protected reverseRecordSizeMap: Object= {
    '512': '512',
    '1K' :'1024',
    '2K' : '2048',
    '4K': '4096',
    '8K': '8192',
    '16K':'16384',
    '32K': '32768',
    '64K': '65536',
    '128K': '131072',
    '256K': '262144',
    '512K': '524288',
    '1024K': '1048576',
    '1M':'1048576'
  };

  convertHumanStringToNum(hstr, field) {

    const IECUnitLetters = this.storageService.IECUnits.map(unit => unit.charAt(0).toUpperCase()).join('');

    let num = 0;
    let unit = '';

    // empty value is evaluated as zero
    if (!hstr) {
        this.humanReadable[field] = '0';
        return 0;
    }

    if (typeof hstr === 'number') {
      hstr = hstr.toString();
    }

    // remove whitespace
    hstr = hstr.replace(/\s+/g, '');

    // get leading number
    if ( num = hstr.match(/^(\d+(\.\d+)?)/) ) {
        num = num[1];
    } else {
        // leading number is required
        this.humanReadable[field] = '';
        return NaN;
    }

    // get optional unit
    unit = hstr.replace(num, '');
    if ( (unit) && !(unit = this.storageService.normalizeUnit(unit)) ) {
        // error when unit is present but not recognized
        this.humanReadable[field] = '';
        return NaN;
    }

    let spacer = (unit) ? ' ' : '';

    this.humanReadable[field] = num.toString() + spacer + unit;
    return num * this.storageService.convertUnitToNum(unit);
}

  public sendAsBasicOrAdvanced(data: DatasetFormData): DatasetFormData {

    if( this.isNew === false ) {
        delete data.name;
    } else {
      data.name = this.parent + "/" + data.name;
    }

    if( this.isNew === true && this.isBasicMode === true ) {
      data.refquota = null;
      data.quota = null;
      data.refreservation = null;
      data.reservation = null;
      data.copies = ( data.copies !== undefined && data.copies !== null && data.name !== undefined) ? "1" : undefined;


    }
    // calculate and delete _unit
      for (let i =0; i < this.size_fields.length; i++) {
        const field = this.size_fields[i];
        if (this.OrigHuman[field] !== data[field]) {
          data[field] = Math.round(this.convertHumanStringToNum(data[field], field));
        } else {
          data[field] = this.OrigSize[field];
        }
      }

    return data;
  }

  blurEventQuota(parent){
    if (parent.entityForm) {
      parent.entityForm.formGroup.controls['quota'].setValue(parent.humanReadable['quota']);
    }
  }

  blurEventRefQuota(parent){
    if (parent.entityForm) {
        parent.entityForm.formGroup.controls['refquota'].setValue(parent.humanReadable['refquota']);
    }
  }

  blurEventReservation(parent){
    if (parent.entityForm) {
        parent.entityForm.formGroup.controls['reservation'].setValue(parent.humanReadable['reservation']);
    }
  }

  blurEventRefReservation(parent){
    if (parent.entityForm) {
        parent.entityForm.formGroup.controls['refreservation'].setValue(parent.humanReadable['refreservation']);
    }
  }



  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService, protected dialogService: DialogService,
    protected storageService: StorageService ) { }



  afterInit(entityForm: EntityFormComponent) {
    this.entityForm = entityForm;
    if(!entityForm.isNew){
      entityForm.setDisabled('casesensitivity',true);
      entityForm.setDisabled('name',true);
      _.find(this.fieldConfig, {name:'name'}).tooltip = "Dataset name (read-only)."
    } else {
      entityForm.setDisabled('share_type', false, false);
      entityForm.formGroup.controls['name'].valueChanges.subscribe((value) => {
        this.nameIsCaseInsensitive = this.nameIsCaseInsensitive;
        const field = _.find(this.fieldConfig, {name: "name"});
        field['hasErrors'] = false;
        field['errors'] = '';
        if (this.nameIsCaseInsensitive) {
          value = value.toLowerCase();
        }
        if (this.namesInUse.includes(value)) {
          let sensitivity;
          this.nameIsCaseInsensitive ? sensitivity = '(This field is not case-sensitive).' : sensitivity = '';
          field['hasErrors'] = true;
          field['errors'] = T(`The name <em>${value}</em> is already in use. ${sensitivity}`);
        }
      })
    }

    entityForm.formGroup.get('share_type').valueChanges.pipe(filter(shareType => !!shareType && entityForm.isNew)).subscribe(shareType => {
      const aclControl = entityForm.formGroup.get('aclmode');
      const caseControl = entityForm.formGroup.get('casesensitivity');
      if (shareType === 'SMB') {
        aclControl.setValue('RESTRICTED');
        caseControl.setValue('INSENSITIVE');
        aclControl.disable();
        caseControl.disable();
      } else {
        aclControl.setValue('PASSTHROUGH');
        caseControl.setValue('SENSITIVE');
        aclControl.enable();
        caseControl.enable();
      }

      aclControl.updateValueAndValidity();
      caseControl.updateValueAndValidity();
    });

    this.recordsize_fg = this.entityForm.formGroup.controls['recordsize'];

    this.recordsize_field = _.find(this.fieldConfig, {name:'recordsize'});
    this.recordsize_fg.valueChanges.subscribe((record_size)=>{
      const record_size_number = parseInt(this.reverseRecordSizeMap[record_size],10);
      if(this.minimum_recommended_dataset_recordsize && this.recommended_size_number){
        this.recordsize_warning = helptext.dataset_form_warning_1 +
          this.minimum_recommended_dataset_recordsize +
          helptext.dataset_form_warning_2;
        if (record_size_number < this.recommended_size_number) {
          this.recordsize_field.warnings = this.recordsize_warning;
          this.isBasicMode = false;
        } else {
          this.recordsize_field.warnings = null;
        }
      }
    });
  }

  preInit(entityForm: EntityFormComponent) {

    const paramMap: any = (<any>this.aroute.params).getValue();
    this.volid = paramMap['volid'];

    if (paramMap['pk'] !== undefined) {
      this.pk = paramMap['pk'];

      const pk_parent = paramMap['pk'].split('/');
      this.parent = pk_parent.splice(0, pk_parent.length - 1).join('/');
      this.customFilter = [[['id', '=', this.pk]]];
    }
    // add new dataset
    if (paramMap['parent'] || paramMap['pk'] === undefined) {
      this.parent = paramMap['parent'];
      this.pk = this.parent;
      this.isNew = true;
      this.fieldSets[0].config[0].readonly = false;
      _.find(this.fieldSets, {class:"dataset"}).label = false;
      _.find(this.fieldSets, {class:"refdataset"}).label = false;
    }
    if(this.parent){
      const root = this.parent.split("/")[0];
      this.ws.call('pool.dataset.recommended_zvol_blocksize',[root]).subscribe(res=>{
        this.minimum_recommended_dataset_recordsize = res;
        this.recommended_size_number = parseInt(this.reverseRecordSizeMap[this.minimum_recommended_dataset_recordsize],0);
      });
      this.ws.call('pool.dataset.query', [[["id", "=", this.pk]]]).subscribe((pk_dataset)=>{
        let children = (pk_dataset[0].children);
        if (pk_dataset[0].casesensitivity.value === 'SENSITIVE') {
          this.nameIsCaseInsensitive = false;
        } else {
          this.nameIsCaseInsensitive = true;
        }
        if (children.length > 0) {
          for (let i in children) {
            if (this.nameIsCaseInsensitive) {
              this.namesInUse.push(/[^/]*$/.exec(children[i].name)[0].toLowerCase());
            } else {
              this.namesInUse.push(/[^/]*$/.exec(children[i].name)[0]);
            }
          };
        };

      if(this.isNew){
        const sync = _.find(this.fieldConfig, {name:'sync'});
        const compression = _.find(this.fieldConfig, {name:'compression'});
        const deduplication = _.find(this.fieldConfig, {name:'deduplication'});
        const exec = _.find(this.fieldConfig, {name:'exec'});
        const readonly = _.find(this.fieldConfig, {name:'readonly'});
        const atime = _.find(this.fieldConfig, {name:'atime'});
        const recordsize = _.find(this.fieldConfig, {name:'recordsize'});
        const sync_inherit = [{label:`Inherit (${pk_dataset[0].sync.rawvalue})`, value: 'INHERIT'}];
        const compression_inherit = [{label:`Inherit (${pk_dataset[0].compression.rawvalue})`, value: 'INHERIT'}];
        const deduplication_inherit = [{label:`Inherit (${pk_dataset[0].deduplication.rawvalue})`, value: 'INHERIT'}];
        const exec_inherit = [{label:`Inherit (${pk_dataset[0].exec.rawvalue})`, value: 'INHERIT'}];
        const readonly_inherit = [{label:`Inherit (${pk_dataset[0].readonly.rawvalue})`, value: 'INHERIT'}];
        const atime_inherit = [{label:`Inherit (${pk_dataset[0].atime.rawvalue})`, value: 'INHERIT'}];
        const recordsize_inherit = [{label:`Inherit (${pk_dataset[0].recordsize.value})`, value: 'INHERIT'}];


        sync.options = sync_inherit.concat(sync.options);
        compression.options = compression_inherit.concat(compression.options);
        deduplication.options = deduplication_inherit.concat(deduplication.options);
        exec.options = exec_inherit.concat(exec.options);
        readonly.options = readonly_inherit.concat(readonly.options);
        atime.options = atime_inherit.concat(atime.options);
        recordsize.options = recordsize_inherit.concat(recordsize.options);


        entityForm.formGroup.controls['sync'].setValue('INHERIT');
        entityForm.formGroup.controls['compression'].setValue('INHERIT');
        entityForm.formGroup.controls['deduplication'].setValue('INHERIT');
        entityForm.formGroup.controls['exec'].setValue('INHERIT');
        entityForm.formGroup.controls['readonly'].setValue('INHERIT');
        entityForm.formGroup.controls['atime'].setValue('INHERIT');
        entityForm.formGroup.controls['recordsize'].setValue('INHERIT');
        }
        else {
          this.ws.call('pool.dataset.query', [[["id", "=", this.parent]]]).subscribe((parent_dataset)=>{
            this.parent_dataset = parent_dataset[0];
            const current_dataset = _.find(this.parent_dataset.children, {'name':this.pk});
            const lower_recordsize_map = {
              '512':'512',
              '1K':'1K',
              '2K':'2K',
            };
            if ( current_dataset.hasOwnProperty("recordsize") && current_dataset['recordsize'].value ) {
                _.find(_.find(this.fieldConfig, {name:'recordsize'}).options, {'label': current_dataset['recordsize'].value})['hiddenFromDisplay'] = false
            }
            const edit_sync = _.find(this.fieldConfig, {name:'sync'});
            const edit_compression = _.find(this.fieldConfig, {name:'compression'});
            const edit_deduplication = _.find(this.fieldConfig, {name:'deduplication'});
            const edit_exec = _.find(this.fieldConfig, {name:'exec'});
            const edit_readonly = _.find(this.fieldConfig, {name:'readonly'});
            const edit_atime = _.find(this.fieldConfig, {name:'atime'});
            const edit_recordsize = _.find(this.fieldConfig, {name:'recordsize'});
            let edit_sync_collection = [{label: pk_dataset[0].sync.value, value: pk_dataset[0].sync.value}];
            let edit_compression_collection = [{label:pk_dataset[0].compression.value, value: pk_dataset[0].compression.value}];
            let edit_deduplication_collection = [{label:pk_dataset[0].deduplication.value, value: pk_dataset[0].deduplication.value}];
            let edit_exec_collection = [{label:pk_dataset[0].exec.value, value: pk_dataset[0].exec.value}];
            let edit_readonly_collection = [{label:pk_dataset[0].readonly.value, value: pk_dataset[0].readonly.value}];
            let edit_atime_collection = [{label:pk_dataset[0].readonly.value, value: pk_dataset[0].readonly.value}];
            let edit_recordsize_collection = [{label: this.parent_dataset.recordsize.value, value:  this.parent_dataset.recordsize.value}];

            edit_sync_collection = [{label:`Inherit (${this.parent_dataset.sync.rawvalue})`, value: 'INHERIT'}];
            edit_sync.options = edit_sync_collection.concat(edit_sync.options);

            edit_compression_collection = [{label:`Inherit (${this.parent_dataset.compression.rawvalue})`, value: 'INHERIT'}];
            edit_compression.options = edit_compression_collection.concat(edit_compression.options);

            edit_deduplication_collection = [{label:`Inherit (${this.parent_dataset.deduplication.rawvalue})`, value: 'INHERIT'}];
            edit_deduplication.options = edit_deduplication_collection.concat(edit_deduplication.options);

            edit_exec_collection = [{label:`Inherit (${this.parent_dataset.exec.rawvalue})`, value: 'INHERIT'}];
            edit_exec.options = edit_exec_collection.concat(edit_exec.options);


            edit_readonly_collection = [{label:`Inherit (${this.parent_dataset.readonly.rawvalue})`, value: 'INHERIT'}];
            edit_readonly.options = edit_readonly_collection.concat(edit_readonly.options);

            edit_atime_collection = [{label:`Inherit (${this.parent_dataset.atime.rawvalue})`, value: 'INHERIT'}];
            edit_atime.options = edit_atime_collection.concat(edit_atime.options);

            edit_recordsize_collection = [{label:`Inherit (${this.parent_dataset.recordsize.value})`, value: 'INHERIT'}];
            edit_recordsize.options = edit_recordsize_collection.concat(edit_recordsize.options);
            let sync_value = pk_dataset[0].sync.value;
            if (pk_dataset[0].sync.source === 'DEFAULT') {
              sync_value = 'INHERIT';
            }
            entityForm.formGroup.controls['sync'].setValue(sync_value);

            let compression_value = pk_dataset[0].compression.value;
            if (pk_dataset[0].compression.source === 'INHERITED' || pk_dataset[0].compression.source === 'DEFAULT') {
              compression_value = 'INHERIT';
            }
            entityForm.formGroup.controls['compression'].setValue(compression_value);

            let deduplication_value = pk_dataset[0].deduplication.value;
            if (pk_dataset[0].deduplication.source === 'DEFAULT' || pk_dataset[0].deduplication.source === 'INHERITED') {
              deduplication_value = 'INHERIT';
            }
            let exec_value = pk_dataset[0].exec.value;
            if (pk_dataset[0].exec.source === 'DEFAULT' || pk_dataset[0].exec.source === 'INHERITED') {
              exec_value = 'INHERIT';
            }
            let readonly_value = pk_dataset[0].readonly.value;
            if (pk_dataset[0].readonly.source === 'DEFAULT' || pk_dataset[0].readonly.source === 'INHERITED') {
              readonly_value = 'INHERIT';
            }
            let atime_value = pk_dataset[0].atime.value;
            if (pk_dataset[0].atime.source === 'DEFAULT' || pk_dataset[0].atime.source === 'INHERITED') {
              atime_value = 'INHERIT';
            }
            let recordsize_value = pk_dataset[0].recordsize.value;
            if (pk_dataset[0].recordsize.source === 'DEFAULT' || pk_dataset[0].recordsize.source === 'INHERITED') {
              recordsize_value = 'INHERIT';
            }

            entityForm.formGroup.controls['deduplication'].setValue(deduplication_value);
            entityForm.formGroup.controls['exec'].setValue(exec_value);
            entityForm.formGroup.controls['readonly'].setValue(readonly_value);
            entityForm.formGroup.controls['atime'].setValue(atime_value);
            entityForm.formGroup.controls['recordsize'].setValue(recordsize_value);
            this.parent_dataset = parent_dataset[0];
          })

        }
      });

    }

  }

  getFieldValueOrRaw(field): any {
    if( field === undefined || field.value === undefined) {
      return field;
    }
    return field.value;
  }

  resourceTransformIncomingRestData(wsResponse): any {
     const quota_warning = this.getFieldValueOrRaw(wsResponse.quota_warning);
     const quota_critical = this.getFieldValueOrRaw(wsResponse.quota_critical);
     const refquota_warning = this.getFieldValueOrRaw(wsResponse.refquota_warning);
     const refquota_critical = this.getFieldValueOrRaw(wsResponse.refquota_critical);
    const sizeValues = {};
    for (let i = 0; i < this.size_fields.length; i++) {
      const field = this.size_fields[i];
      if (wsResponse[field] && wsResponse[field].rawvalue) {
        this.OrigSize[field] = wsResponse[field].rawvalue;
      }
      sizeValues[field] = this.getFieldValueOrRaw(wsResponse[field]);
      this.convertHumanStringToNum(sizeValues[field], field);
      this.OrigHuman[field] = this.humanReadable[field];
    }

     const returnValue: DatasetFormData = {
        name: this.getFieldValueOrRaw(wsResponse.name),
        atime: this.getFieldValueOrRaw(wsResponse.atime),
        share_type: this.getFieldValueOrRaw(wsResponse.share_type),
        aclmode: this.getFieldValueOrRaw(wsResponse.aclmode),
        casesensitivity: this.getFieldValueOrRaw(wsResponse.casesensitivity),
        comments: wsResponse.comments === undefined ? wsResponse.comments : (wsResponse.comments.source === 'LOCAL' ? wsResponse.comments.value : undefined),
        compression: this.getFieldValueOrRaw(wsResponse.compression),
        copies: this.getFieldValueOrRaw(wsResponse.copies),
        deduplication: this.getFieldValueOrRaw(wsResponse.deduplication),
        quota_warning: quota_warning,
        quota_critical: quota_critical,
        refquota_warning: refquota_warning,
        refquota_critical: refquota_critical,
        quota: this.OrigHuman['quota'],
        readonly: this.getFieldValueOrRaw(wsResponse.readonly),
        exec: this.getFieldValueOrRaw(wsResponse.exec),
        recordsize: this.getFieldValueOrRaw(wsResponse.recordsize),
        refquota: this.OrigHuman['refquota'],
        refreservation: this.OrigHuman['refreservation'],
        reservation: this.OrigHuman['reservation'],
        snapdir: this.getFieldValueOrRaw(wsResponse.snapdir),
        sync: this.getFieldValueOrRaw(wsResponse.sync)
     };

     // If combacks as Megabytes... Re-convert it to K.  Oddly enough.. It only takes K as an input.
    //  if( returnValue.recordsize !== undefined && returnValue.recordsize.indexOf("M") !== -1) {
    //    const value = Number.parseInt(returnValue.recordsize.replace("M", ""));
    //    returnValue.recordsize = "" + ( 1024 * value ) + "K";
    //  }

     if (sizeValues['quota'] || sizeValues['refquota'] || sizeValues['refreservation'] || sizeValues['reservation'] ||
      quota_warning ||quota_critical ||refquota_warning||refquota_critical) {
       this.isBasicMode = false;
     }

     return returnValue;
  }

  editSubmit(body: any) {
    const data: any = this.sendAsBasicOrAdvanced(body);
    if (data.quota === 0) {
      data.quota = null;
    }
    if (data.refquota === 0) {
      data.refquota = null;
    }
    // if (data.refreservation === 0) {
    //   data.refreservation = null;
    // }
    // if (data.reservation === 0) {
    //   data.reservation = null;
    // }
    if (data.recordsize === "1M") {
      data.recordsize = "1024K";
    }
    return this.ws.call('pool.dataset.update', [this.pk, data]);
  }

  addSubmit(body: any) {
    const data: any = this.sendAsBasicOrAdvanced(body);
    if (data.quota === 0) {
      delete data.quota;
    }
    if (data.refquota === 0) {
      delete data.refquota;
    }
    if (data.refreservation === 0) {
      delete data.refreservation;
    }
    if (data.reservation === 0) {
      delete data.reservation;
    }
    if (data.recordsize === 'INHERIT') {
      delete(data.recordsize);
    }
    if (data.sync === 'INHERIT') {
      delete(data.sync);
    }
    if (data.compression === 'INHERIT') {
      delete(data.compression);
    }
    if (data.atime === 'INHERIT') {
      delete(data.atime);
    }
    if (data.exec === 'INHERIT') {
      delete(data.exec);
    }
    if (data.readonly === 'INHERIT') {
      delete(data.readonly);
    }
    if (data.deduplication === 'INHERIT') {
      delete(data.deduplication);
    }
    if (data.recordsize === "1M") {
      data.recordsize = "1024K";
    }
    return this.ws.call('pool.dataset.create', [ data ]);
  }

  customSubmit(body) {
    this.loader.open();

    return ((this.isNew === true ) ? this.addSubmit(body) : this.editSubmit(body)).subscribe((restPostResp) => {
      this.loader.close();

      this.router.navigate(new Array('/').concat(
        this.route_success));
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

}
