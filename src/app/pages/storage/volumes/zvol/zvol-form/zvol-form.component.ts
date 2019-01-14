import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../../services/';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { T } from '../../../../../translate-marker';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { EntityUtils } from '../../../../common/entity/utils';
import helptext from '../../../../../helptext/storage/volumes/zvol-form';

interface ZvolFormData {
  name: string;
  comments: string;
  volsize: number;
  volsize_unit: string;
  force_size: boolean;
  sync: string;
  compression: string;
  deduplication: string;
  sparse: boolean;
  volblocksize: string;
  type: string;
};

@Component({
  selector : 'app-zvol-add',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ZvolFormComponent {

  protected pk: any;
  protected path: string;
  public sub: Subscription;
  protected route_success: string[] = [ 'storage', 'pools' ];
  public queryCall = "pool.dataset.query";
  protected compression: any;
  protected advanced_field: Array<any> = [ 'volblocksize' ];
  protected isBasicMode = true;
  protected isNew = true;
  protected isEntity = true;
  public parent: string;
  public data: any;
  public parent_data: any;
  public volid: string;
  public customFilter: any[] = [];
  public pk_dataset: any[] = [];
  public edit_data: any;
  protected entityForm: any;
  public minimum_recommended_zvol_volblocksize: string;

  protected origVolSize;
  protected origVolSizeUnit;
  protected origVolSizeDec;

  public custActions: Array<any> = [
    {
      id: 'basic_mode',
      name: T('Basic Mode'),
      function: () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      id: 'advanced_mode',
      name: T('Advanced Mode'),
      function: () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  protected byteMap: Object= {
    'T': 1099511627776,
    'G': 1073741824,
    'M': 1048576,
    'K': 1024,
  };

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: helptext.zvol_name_placeholder,
      tooltip: helptext.zvol_name_tooltip,
      validation: helptext.zvol_name_validation,
      required: true,
      isHidden: false
    },
    {
      type: 'input',
      name: 'comments',
      placeholder: helptext.zvol_comments_placeholder,
      tooltip: helptext.zvol_comments_tooltip,
    },
    {
      type: 'input',
      name: 'volsize',
      inputType: 'number',
      placeholder: helptext.zvol_volsize_placeholder,
      tooltip : helptext.zvol_volsize_tooltip,
      validation: [Validators.required, Validators.min(0)],
      required: true,
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
    },
    {
      type: 'select',
      name: 'volsize_unit',
      options: [ {
        label: 'KiB',
        value: 'K',
      }, {
        label: 'MiB',
        value: 'M',
      }, {
        label: 'GiB',
        value: 'G',
      },{
        label: 'TiB',
        value: 'T',
      }],
      value: 'G',
      class: 'inline',
      width: '30%',
    },
    {
      type: 'checkbox',
      name : 'force_size',
      placeholder: helptext.zvol_forcesize_placeholder,
      tooltip : helptext.zvol_forcesize_tooltip,
    },
    {
      type: 'select',
      name: 'sync',
      placeholder: helptext.zvol_sync_placeholder,
      tooltip: helptext.zvol_sync_tooltip,
      options: [
        { label: 'Standard', value: 'STANDARD' },
        { label: 'Always', value: 'ALWAYS' },
        { label: 'Disabled', value: 'DISABLED' }
      ],
    },
    {
      type: 'select',
      name: 'compression',
      placeholder: helptext.zvol_compression_placeholder,
      tooltip: helptext.zvol_compression_tooltip,
      options: [
        {label : 'Off', value : "OFF"},
        {label : 'lz4 (recommended)', value : "LZ4"},
        {label : 'gzip (default level, 6)', value : "GZIP"},
        {label : 'gzip (fastest)', value : "GZIP-1"},
        {label : 'gzip (maximum, slow)', value : "GZIP-9"},
        {label : 'zle (runs of zeros)', value : "ZLE"},
        {label : 'lzjb (legacy, not recommended)', value : "LZJB"},
      ],
      validation: helptext.zvol_compression_validation,
      required: true,
    },
    {
      type: 'select',
      name: 'deduplication',
      placeholder: helptext.zvol_deduplication_placeholder,
      tooltip : helptext.zvol_deduplication_tooltip,
      options: [
        {label : 'On', value : "ON"},
        {label : 'Verify', value : "VERIFY"},
        {label : 'Off', value : "OFF"},
      ],
      validation: helptext.zvol_deduplication_validation,
      required: true,
    },
    {
      type: 'checkbox',
      name : 'sparse',
      placeholder: helptext.zvol_sparse_placeholder,
      tooltip : helptext.zvol_sparse_tooltip,
      isHidden: false
    },
    {
      type: 'select',
      name: 'volblocksize',
      placeholder: helptext.zvol_volblocksize_placeholder,
      tooltip: helptext.zvol_volblocksize_tooltip,
      options: [
        { label: '4K', value: '4K' },
        { label: '8K', value: '8K' },
        { label: '16K', value: '16K' },
        { label: '32K', value: '32K' },
        { label: '64K', value: '64K' },
        { label: '128K', value: '128K' },
      ],
      isHidden: false
    },
  ];

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }



  public sendAsBasicOrAdvanced(data: ZvolFormData): ZvolFormData {
    data.type = "VOLUME"

    if( this.isNew === false ) {
        delete data.name;
        delete data.volblocksize;
        delete data.type;
        delete data.sparse;
    } else {
      data.name = this.parent + "/" + data.name;
    }

    if( this.isBasicMode === true ) {

    }
    if (this.origVolSizeDec !== data.volsize || this.origVolSizeUnit !== data.volsize_unit) {
      data.volsize = data.volsize * this.byteMap[data.volsize_unit];
    } else { 
      data.volsize = this.origVolSize;
    }
    delete data.volsize_unit;
    return data;
  }


  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected loader: AppLoaderService, protected dialogService: DialogService
              ) {}


  async preInit(entityForm: EntityFormComponent){
    const paramMap: any = (<any>this.aroute.params).getValue();
    this.parent = paramMap['path']


    const name = _.find(this.fieldConfig, {name:'name'});
    const sparse =   _.find(this.fieldConfig, {name:'sparse'});
    const sync = _.find(this.fieldConfig, {name:'sync'});
    const compression = _.find(this.fieldConfig, {name:'compression'});
    const deduplication = _.find(this.fieldConfig, {name:'deduplication'});
    const volblocksize = _.find(this.fieldConfig, {name:'volblocksize'});


    await this.ws.call('pool.dataset.query', [[["id", "=", this.parent]]]).toPromise().then((pk_dataset)=>{

      if(pk_dataset && pk_dataset[0].type ==="FILESYSTEM"){


        const sync_inherit = [{label:`Inherit (${pk_dataset[0].sync.rawvalue})`, value: 'INHERIT'}];
        const compression_inherit = [{label:`Inherit (${pk_dataset[0].compression.rawvalue})`, value: 'INHERIT'}];
        const deduplication_inherit = [{label:`Inherit (${pk_dataset[0].deduplication.rawvalue})`, value: 'INHERIT'}];
        const volblocksize_inherit = [{label:`Inherit`, value: 'INHERIT'}];

        sync.options = sync_inherit.concat(sync.options);
        compression.options = compression_inherit.concat(compression.options);        
        deduplication.options = deduplication_inherit.concat(deduplication.options);
        volblocksize.options = volblocksize_inherit.concat(volblocksize.options);

        entityForm.formGroup.controls['sync'].setValue('INHERIT');
        entityForm.formGroup.controls['compression'].setValue('INHERIT');
        entityForm.formGroup.controls['deduplication'].setValue('INHERIT');
        this.ws.call('pool.dataset.recommended_zvol_blocksize',[this.parent]).subscribe(res=>{
          this.entityForm.formGroup.controls['volblocksize'].setValue(res);
        })

      } else {
        let parent_dataset = pk_dataset[0].name.split('/')
        parent_dataset.pop()
        parent_dataset = parent_dataset.join('/')

        this.ws.call('pool.dataset.query', [[["id","=",parent_dataset]]]).subscribe((parent_dataset_res)=>{
          this.custActions = null;
          entityForm.setDisabled('name',true);
          sparse['isHidden'] =true;
          volblocksize['isHidden'] =true;
          _.find(this.fieldConfig, {name:'sparse'})['isHidden']=true;
          this.customFilter = [[["id", "=", this.parent]]]
          this.isNew =false;
          let sync_collection = [{label:pk_dataset[0].sync.value, value: pk_dataset[0].sync.value}];
          let compression_collection = [{label:pk_dataset[0].compression.value, value: pk_dataset[0].compression.value}];
          let deduplication_collection = [{label:pk_dataset[0].deduplication.value, value: pk_dataset[0].deduplication.value}];

          let volumesize = pk_dataset[0].volsize.parsed;
          const volumeunit =  pk_dataset[0].volsize.value.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[1];

          // keep track of original volume size data so we can check to see if the user intended to change since
          // decimal has to be truncated to three decimal places
          this.origVolSize = volumesize;
          volumesize = volumesize/this.byteMap[volumeunit];
          volumesize = volumesize.toFixed(3)
          this.origVolSizeDec = volumesize;
          this.origVolSizeUnit = volumeunit;

          entityForm.formGroup.controls['name'].setValue(pk_dataset[0].name);
          if(pk_dataset[0].comments){
            entityForm.formGroup.controls['comments'].setValue(pk_dataset[0].comments.value);
          }
          else {
            entityForm.formGroup.controls['comments'].setValue('');
          }

          entityForm.formGroup.controls['volsize'].setValue(volumesize);

          entityForm.formGroup.controls['volsize_unit'].setValue(volumeunit);


          if (pk_dataset[0].sync.source === "INHERITED" || pk_dataset[0].sync.source === "DEFAULT" ){
            sync_collection = [{label:`Inherit (${parent_dataset_res[0].sync.rawvalue})`, value: parent_dataset_res[0].sync.value}];


          } else {
            sync_collection = [{label:`Inherit (${parent_dataset_res[0].sync.rawvalue})`, value: 'INHERIT'}];
            entityForm.formGroup.controls['sync'].setValue(pk_dataset[0].sync.value);
          }

          sync.options = sync_collection.concat(sync.options);

          if (pk_dataset[0].compression.source === "INHERITED" || pk_dataset[0].compression.source === "DEFAULT" ){
            compression_collection = [{label:`Inherit (${parent_dataset_res[0].compression.rawvalue})`, value: parent_dataset_res[0].compression.value}];

          } else {
            compression_collection = [{label:`Inherit (${parent_dataset_res[0].compression.rawvalue})`, value: 'INHERIT'}];
            entityForm.formGroup.controls['compression'].setValue(pk_dataset[0].compression.value);
          }

          compression.options = compression_collection.concat(compression.options);


          if (pk_dataset[0].deduplication.source === "INHERITED" || pk_dataset[0].deduplication.source === "DEFAULT" ){
            deduplication_collection = [{label:`Inherit (${parent_dataset_res[0].deduplication.rawvalue})`, value: parent_dataset_res[0].deduplication.value}];

          } else {
            deduplication_collection = [{label:`Inherit (${parent_dataset_res[0].deduplication.rawvalue})`, value: 'INHERIT'}];
            entityForm.formGroup.controls['deduplication'].setValue(pk_dataset[0].deduplication.value);
          }

          deduplication.options = deduplication_collection.concat(deduplication.options);


          entityForm.formGroup.controls['sync'].setValue(pk_dataset[0].sync.value);
          if (pk_dataset[0].compression.value === 'GZIP') {
            entityForm.formGroup.controls['compression'].setValue(pk_dataset[0].compression.value+'-6');
          }
          else{
            entityForm.formGroup.controls['compression'].setValue(pk_dataset[0].compression.value);

          }
          entityForm.formGroup.controls['deduplication'].setValue(pk_dataset[0].deduplication.value);

        })

      }
    })



  }

  afterInit(entityForm: EntityFormComponent) {
    this.entityForm = entityForm;
    if(!entityForm.isNew){
    }
  }

  addSubmit(body: any) {
    const data: any = this.sendAsBasicOrAdvanced(body);

    if (data.sync === 'INHERIT') {
      delete(data.sync);
    }
    if (data.compression === 'INHERIT') {
      delete(data.compression);
    }
    if (data.deduplication === 'INHERIT') {
      delete(data.deduplication);
    }
    if (data.volblocksize !== 'INHERIT') {
      let volblocksize_integer_value = data.volblocksize.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[0];
      volblocksize_integer_value = parseInt(volblocksize_integer_value,10)


      if (volblocksize_integer_value === 512){
        volblocksize_integer_value = 512
      } else {
        volblocksize_integer_value = volblocksize_integer_value * 1024
      }


      data.volsize = data.volsize + (volblocksize_integer_value - data.volsize%volblocksize_integer_value)


    } else{
      delete(data.volblocksize);
    }


    return this.ws.call('pool.dataset.create', [ data ]);
  }
  editSubmit(body: any) {
     this.ws.call('pool.dataset.query', [[["id", "=", this.parent]]]).subscribe((res)=>{
      this.edit_data = this.sendAsBasicOrAdvanced(body);
      let volblocksize_integer_value = res[0].volblocksize.value.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[0];
      volblocksize_integer_value = parseInt(volblocksize_integer_value,10)
      if (volblocksize_integer_value === 512){
        volblocksize_integer_value = 512
      } else {
        volblocksize_integer_value = volblocksize_integer_value * 1024
      }
      if(this.edit_data.volsize%volblocksize_integer_value !== 0){
        this.edit_data.volsize = this.edit_data.volsize + (volblocksize_integer_value - this.edit_data.volsize%volblocksize_integer_value)
      }
      let rounded_vol_size  = res[0].volsize.parsed

      if(res[0].volsize.parsed%volblocksize_integer_value !== 0){
        rounded_vol_size  = res[0].volsize.parsed + (volblocksize_integer_value - res[0].volsize.parsed%volblocksize_integer_value)
      }

      if(this.edit_data.volsize >= rounded_vol_size){
        this.ws.call('pool.dataset.update', [this.parent, this.edit_data]).subscribe((restPostResp) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(
            this.route_success));
        }, (eres) => {
          this.loader.close();
          new EntityUtils().handleWSError(this.entityForm, eres);
        });
      } else{
        this.loader.close();
        this.dialogService.Info(T("Error saving ZVOL."), "Shrinking a ZVOL is not allowed in the User Interface. This can lead to data loss.")
      }
    })
  }

  customSubmit(body: any) {


    this.loader.open();

    if(this.isNew === true){
      this.addSubmit(body).subscribe((restPostResp) => {
        this.loader.close();

        this.router.navigate(new Array('/').concat(
          this.route_success));
      }, (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      });
    } else{
      this.editSubmit(body);
    }
  }

}
