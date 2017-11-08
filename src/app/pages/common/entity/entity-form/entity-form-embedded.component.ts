import {Location} from '@angular/common';
import {
  Component,
  ContentChildren,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChildren
} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormArray, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import { MdSnackBar } from '@angular/material';

import {RestService, WebSocketService} from '../../../../services/';
import {AppLoaderService} from '../../../../services/app-loader/app-loader.service';
import {EntityTemplateDirective} from '../entity-template.directive';
import {EntityUtils} from '../utils';

import {FieldConfig} from './models/field-config.interface';
import {FieldSet} from './models/fieldset.interface';
import {EntityFormService} from './services/entity-form.service';
import {FieldRelationService} from './services/field-relation.service';

@Component({
  selector : 'entity-form-embedded',
  templateUrl : './entity-form-embedded.component.html',
  styleUrls : [ './entity-form-embedded.component.css' ],
  providers : [ EntityFormService, FieldRelationService ]
})
export class EntityFormEmbeddedComponent implements OnInit, OnDestroy {

  @Input('conf') conf: any;
  @Input()  args: string;

  protected pk: any;
  public formGroup: FormGroup;
  public fieldSetDisplay: string;
  public fieldSets: FieldSet[]
  public fieldConfig: FieldConfig[];
  protected resourceName: string;
  public getFunction;
  public submitFunction = this.editSubmit;
  private isNew: boolean = false;
  public hasConf: boolean = true;

  get controls() {
    return this.fieldConfig.filter(({type}) => type !== 'button');
  }
  get changes() { return this.formGroup.valueChanges; }
  get valid() { return this.formGroup.valid; }
  get value() { return this.formGroup.value; }

  templateTop: TemplateRef<any>;
  @ContentChildren(EntityTemplateDirective)
  templates: QueryList<EntityTemplateDirective>;

  @ViewChildren('component') components;

  public busy: Subscription;

  public sub: any;
  public error: string;
  public success: boolean = false;
  public data: Object = {};

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected location: Location, private fb: FormBuilder,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    public snackBar: MdSnackBar) {}

  ngAfterViewInit() {
    this.templates.forEach((item) => {
      if (item.type == 'TOP') {
	this.templateTop = item.templateRef;
      }
    });
  }

  ngOnInit() {
    if (this.conf.preInit) {
      this.conf.preInit(this);
    }
    this.init(this.args);
    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
  }

  init(params){
    this.resourceName = this.conf.resource_name;
    if (this.resourceName && !this.resourceName.endsWith('/')) {
      this.resourceName = this.resourceName + '/';
    }
    if (this.conf.isEntity) {
      this.pk = params;
      if (this.pk && !this.conf.isNew) {
	if (this.conf.editCall) {
	  this.submitFunction = this.editCall;
	} else {
	  this.submitFunction = this.editSubmit;
	  this.resourceName = this.resourceName + this.pk + '/';
	}      
      } else {
	if (this.conf.addCall) {
	  this.submitFunction = this.addCall;
	} else {
	  this.submitFunction = this.addSubmit;
	}
	this.isNew = true;
      }
    }

    this.fieldConfig = this.conf.fieldConfig;
    this.fieldSetDisplay = this.conf.fieldSetDisplay;
    this.fieldSets = this.conf.fieldSets;
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

      for (let i in this.fieldConfig) {
	let config = this.fieldConfig[i];
	if (config.relation.length > 0) {
	  this.setRelation(config);
	}
      }

    if (this.conf.queryCall) {
      if(this.pk) {
	this.getFunction = this.ws.call(this.conf.queryCall, [this.pk]);
      } else {
	this.getFunction = this.ws.call(this.conf.queryCall, []);
      }
    } else {
      let getQuery = this.resourceName;
      if (this.conf.custom_get_query) {
	getQuery = this.conf.custom_get_query;
      }
      this.getFunction = this.rest.get(getQuery, {}, this.conf.route_usebaseUrl);
    }

    if (!this.isNew) {
      this.getFunction.subscribe((res) => {
	this.data = res.data;
	if( typeof(this.conf.resourceTransformIncomingRestData) !== "undefined" ) {
	  this.data = this.conf.resourceTransformIncomingRestData(this.data);
	}
	for (let i in this.data) {
	  let fg = this.formGroup.controls[i];
	  if (fg) {
	    let current_field = this.fieldConfig.find((control) => control.name === i);
	    if (current_field.type == "array") {
	      this.setArrayValue(this.data[i], fg, i);
	    } else {
	      fg.setValue(this.data[i]);
	    }
	  }
	}
	if (this.conf.initial) {
	  this.conf.initial.bind(this.conf)(this);
	}
      });
    }
  }

  ngOnChanges() {
    if (this.formGroup) {
      const controls = Object.keys(this.formGroup.controls);
      const configControls = this.controls.map((item) => item.name);

      controls.filter((control) => !configControls.includes(control))
	.forEach((control) => this.formGroup.removeControl(control));

      configControls.filter((control) => !controls.includes(control))
	.forEach((name) => {
	  const config =
	    this.fieldConfig.find((control) => control.name === name);
	  this.formGroup.addControl(name, this.createControl(config));
	});
    }
  }

  goBack() {
    this.conf.goBack();
  }

  addCall(body: any) {
    let payload = []
    let call = this.conf.addCall;
    payload.push(body)
    return this.ws.call(call, payload);
  }

  editSubmit(body: any) { 
    let resource = this.resourceName;
    if (this.conf.custom_edit_query) {
      resource = this.conf.custom_edit_query;
    }

    return this.rest.put(resource, {body}, this.conf.route_usebaseUrl);
  }

  editCall(body: any) {
    let call = this.conf.editCall;

    return this.ws.call(call, body);
  }

  addSubmit(body: any) {
    let resource = this.resourceName;
    if (this.conf.custom_add_query) {
      resource = this.conf.custom_add_query;
    }

    return this.rest.post(resource, {body}, this.conf.route_usebaseUrl); 
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    this.success = false;
    this.clearErrors();
    let value = _.cloneDeep(this.formGroup.value);
    for (let i in value) {
      if (value.hasOwnProperty(i)) {
	if (this.conf['clean_' + i]) {
	  value = this.conf['clean_' + i](value, i);
	}
      }
    }
    if ('id' in value) {
      delete value['id'];
    }

    if (this.conf.clean) {
      value = this.conf.clean.bind(this.conf)(value);
    }

    if (this.conf.beforeSubmit) {
      this.conf.beforeSubmit(value);
    }

    this.loader.open();
    this.busy = this.submitFunction(value)
      .subscribe(
	(res) => {
	  this.loader.close();
	  if (this.conf.route_success) {
	    //this.router.navigate(new Array('/').concat(
	    //this.conf.route_success));
	  } else {
	    this.snackBar.open("All your settings are saved.", 'close', { duration: 5000 })
	    this.success = true;
	    this.conf.onSuccess(res);
	  }
	},
	(res) => {
	  this.loader.close();
	  new EntityUtils().handleError(this, res); });
  }

  clearErrors() {
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f].errors = '';
      this.fieldConfig[f].hasErrors = false;
    }
  }

  isShow(id: any): any {
    if (this.conf.isBasicMode) {
      if (this.conf.advanced_field.indexOf(id) > -1) {
	return false;
      }
    }
    return true;
  }

  goConf() {
    let route = this.conf.route_conf;
    if (!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/').concat(route));
  }

  createControl(config: FieldConfig) {
    const {disabled, validation, value} = config;
    return this.fb.control({disabled, value}, validation);
  }

  setDisabled(name: string, disable: boolean) {
    if (this.formGroup.controls[name]) {
      const method = disable ? 'disable' : 'enable';
      this.formGroup.controls[name][method]();
      return;
    }

    this.fieldConfig = this.fieldConfig.map((item) => {
      if (item.name === name) {
	item.disabled = disable;
      }
      return item;
    });
  }

  setValue(name: string, value: any) {
    this.formGroup.controls[name].setValue(value, {emitEvent : true});
  }

  setArrayValue(data: any[], formArray: any, name: string) {
    let array_controls: any;
    for (let i in this.fieldConfig) {
      let config = this.fieldConfig[i];
      if (config.name == name) {
	array_controls = config.formarray;
      }
    }

    if(this.conf.preHandler) {
      data = this.conf.preHandler(data, formArray);
    }

    data.forEach((value, index) => {
      this.conf.initialCount += 1;
      this.conf.initialCount_default += 1;

      let formGroup = this.entityFormService.createFormGroup(array_controls);
      for (let i in value) {
	let formControl = formGroup.controls[i];
	formControl.setValue(value[i]);
      }
      formArray.insert(index, formGroup);
    });
  }

  setRelation(config: FieldConfig) {
    let activations =
      this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      let tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
	activations, this.formGroup);
      this.setDisabled(config.name, tobeDisabled);

      this.fieldRelationService.getRelatedFormControls(config, this.formGroup)
	.forEach(control => {
	  control.valueChanges.subscribe(
	    () => { this.relationUpdate(config, activations); });
	});
    }
  }

  relationUpdate(config: FieldConfig, activations: any) {
    let tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
      activations, this.formGroup);
    this.setDisabled(config.name, tobeDisabled);
  }

  ngOnDestroy() { 
    if(this.sub){
      this.sub.unsubscribe(); 
    }
  }
}
