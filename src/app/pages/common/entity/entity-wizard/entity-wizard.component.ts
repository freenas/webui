import { StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  Component, Input, OnInit, ViewChild,
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormGroup,
} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { WebSocketService, DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { T } from 'app/translate-marker';
import { FieldConfig } from '../entity-form/models/field-config.interface';
import { EntityFormService } from '../entity-form/services/entity-form.service';
import { FieldRelationService } from '../entity-form/services/field-relation.service';
import { EntityUtils } from '../utils';

@UntilDestroy()
@Component({
  selector: 'entity-wizard',
  templateUrl: './entity-wizard.component.html',
  styleUrls: ['./entity-wizard.component.scss', '../entity-form/entity-form.component.scss'],
  providers: [EntityFormService, FieldRelationService],
})
export class EntityWizardComponent implements OnInit {
  @Input('conf') conf: any;
  @ViewChild('stepper', { static: true }) stepper: MatStepper;

  formGroup: FormGroup;
  showSpinner = false;

  summaryValue: any;
  summaryFieldConfigs: FieldConfig[] = [];

  saveSubmitText = T('Submit');
  customNextText = T('Next');
  get formArray(): AbstractControl | null { return this.formGroup.get('formArray'); }

  constructor(
    protected ws: WebSocketService,
    private formBuilder: FormBuilder,
    private entityFormService: EntityFormService,
    public loader: AppLoaderService,
    protected fieldRelationService: FieldRelationService,
    protected router: Router,
    protected aroute: ActivatedRoute,
    private dialog: DialogService,
    protected translate: TranslateService,
  ) {}

  ngOnInit(): void {
    if (this.conf.showSpinner) {
      this.showSpinner = true;
    }
    if (this.conf.preInit) {
      this.conf.preInit(this);
    }

    this.resetFields();

    if (this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
    }

    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
  }

  resetFields(): void {
    const wizardformArray = this.formBuilder.array([]);
    for (const i in this.conf.wizardConfig) {
      // Fallback if no fieldsets are defined
      if (this.conf.wizardConfig[i].fieldSets) {
        let fieldConfig: any[] = [];
        /* Temp patch to support both FieldSet approaches */
        const fieldSets = this.conf.wizardConfig[i].fieldSets.list
          ? this.conf.wizardConfig[i].fieldSets.list()
          : this.conf.wizardConfig[i].fieldSets;
        for (let j = 0; j < fieldSets.length; j++) {
          const fieldset = fieldSets[j];
          if (fieldset.config) {
            fieldConfig = fieldConfig.concat(fieldset.config);
          }
        }
        this.conf.wizardConfig[i].fieldConfig = fieldConfig;
      } else {
        // const fieldConfig = this.conf.wizardConfig[i].fieldConfig;
        this.conf.wizardConfig[i].fieldSets = [
          {
            name: 'FallBack',
            class: 'fallback',
            width: '100%',
            divider: false,
            config: this.conf.wizardConfig[i].fieldConfig,
          },
          {
            name: 'divider',
            divider: true,
            width: '100%',
          },
        ];
      }
      wizardformArray.push(this.entityFormService.createFormGroup(this.conf.wizardConfig[i].fieldConfig));
    }

    this.formGroup = this.formBuilder.group({
      formArray: wizardformArray,
    });

    for (const i in this.conf.wizardConfig) {
      this.summaryFieldConfigs = this.summaryFieldConfigs.concat(this.conf.wizardConfig[i].fieldConfig);
      const formGroup = this.formArray.get(i) as FormGroup;
      for (const j in this.conf.wizardConfig[i].fieldConfig) {
        const config = this.conf.wizardConfig[i].fieldConfig[j];
        this.fieldRelationService.setRelation(config, formGroup);
      }
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

  goBack(): void {
    if (this.conf.customCancel) {
      return this.conf.customCancel();
    }
    let route = this.conf.route_cancel;
    if (!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/').concat(route));
  }

  setDisabled(name: string, disable: boolean, stepIndex: any, hide?: boolean): void {
    if (hide) {
      disable = hide;
    } else {
      hide = false;
    }

    for (const i in this.conf.wizardConfig) {
      this.conf.wizardConfig[i].fieldConfig = this.conf.wizardConfig[i].fieldConfig.map((item: any) => {
        if (item.name === name) {
          item.disabled = disable;
          item['isHidden'] = hide;
        }
        return item;
      });
    }

    if ((this.formArray.get([stepIndex]) as FormGroup).controls[name]) {
      const method = disable ? 'disable' : 'enable';
      (this.formArray.get([stepIndex]) as FormGroup).controls[name][method]();
    }
  }

  onSubmit(): void {
    let value = {};
    for (const i in this.formGroup.value.formArray) {
      value = _.merge(value, _.cloneDeep(this.formGroup.value.formArray[i]));
    }

    value = new EntityUtils().changeNullString2Null(value);

    if (this.conf.beforeSubmit) {
      value = this.conf.beforeSubmit(value);
    }

    this.clearErrors();
    if (this.conf.customSubmit) {
      this.conf.customSubmit(value);
    } else {
      this.loader.open();

      this.ws.job(this.conf.addWsCall, [value]).pipe(untilDestroyed(this)).subscribe(
        (res) => {
          this.loader.close();
          if (res.error) {
            this.dialog.errorReport(res.error, (res as any).reason, res.exception);
          } else if (this.conf.route_success) {
            this.router.navigate(new Array('/').concat(this.conf.route_success));
          } else {
            this.dialog.Info(T('Settings saved'), '', '300px', 'info', true);
          }
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        },
      );
    }
  }

  isFieldsetAvailabel(fieldset: any): boolean {
    if (fieldset.config) {
      for (let i = 0; i < fieldset.config.length; i++) {
        if (!fieldset.config[i].isHidden) {
          return true;
        }
      }
    }
    return false;
  }

  handleNext(currentStep: any): void {
    currentStep.stepControl.markAllAsTouched();
    if (this.conf.customNext !== undefined) {
      this.conf.customNext(this.stepper);
    }
  }

  /**
   * This function is for update summary data whenever step changes
   * We use isAutoSummary flag to generate summary automatically
   */
  selectionChange(event: StepperSelectionEvent): void {
    if (this.conf.isAutoSummary) {
      if (event.selectedIndex == this.conf.wizardConfig.length) {
        let value = {};
        for (const i in this.formGroup.value.formArray) {
          value = _.merge(value, _.cloneDeep(this.formGroup.value.formArray[i]));
        }
        this.summaryValue = value;
      }
    }
  }

  clearErrors(): void {
    for (const i in this.conf.wizardConfig) {
      for (const j in this.conf.wizardConfig[i].fieldConfig) {
        const config = this.conf.wizardConfig[i].fieldConfig[j];
        config['errors'] = '';
        config['hasErrors'] = false;
      }
    }
  }
}
