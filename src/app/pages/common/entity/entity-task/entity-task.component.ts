import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { TaskService, UserService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { EntityFormComponent } from '../entity-form';
import { EntityFormService } from '../entity-form/services/entity-form.service';

@UntilDestroy()
@Component({
  selector: 'entity-task',
  templateUrl: './entity-task.component.html',
  styleUrls: ['entity-task.component.scss'],
  providers: [TaskService, UserService, EntityFormService],
})
export class EntityTaskComponent implements OnInit {
  @Input('conf') conf: any;

  protected entityForm: EntityFormComponent;
  protected isEntity = true;

  protected user_field: any;
  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  formGroup: FormGroup;
  error: string;
  protected pk: any;
  isNew = false;
  protected data: any;
  showDefaults = false;

  protected preTaskName = '';

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected taskService: TaskService,
    protected userService: UserService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService,
  ) {}

  ngOnInit(): void {
    if (this.conf.preInit) {
      this.conf.preInit();
    }

    this.preTaskName = this.conf.preTaskName;

    const date = new Date();
    this.month_field = _.find(this.conf.fieldConfig, { name: this.preTaskName + '_month' });
    this.day_field = _.find(this.conf.fieldConfig, { name: this.preTaskName + '_dayweek' });
    this.daymonth_field = _.find(this.conf.fieldConfig, { name: this.preTaskName + '_daymonth' });
    this.hour_field = _.find(this.conf.fieldConfig, { name: this.preTaskName + '_hour' });
    this.mintue_field = _.find(this.conf.fieldConfig, { name: this.preTaskName + '_minute' });

    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (this.conf.resource_name && !this.conf.resource_name.endsWith('/')) {
        this.conf.resource_name = this.conf.resource_name + '/';
      }
      if (this.isEntity) {
        this.pk = params['pk'];
        if (this.pk && !this.isNew) {
          // only enable advanced mode
        } else {
          this.isNew = true;
        }
      }
      this.formGroup = this.entityFormService.createFormGroup(this.conf.fieldConfig);
      this.formGroup.controls[this.preTaskName + '_repeat'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
        if (res == 'none') {
          this.month_field['isHidden'] = false;
          this.day_field['isHidden'] = false;
          this.daymonth_field['isHidden'] = false;
          this.hour_field['isHidden'] = false;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew) {
            this.formGroup.controls[this.preTaskName + '_month'].setValue([date.getMonth().toString()]);
            this.formGroup.controls[this.preTaskName + '_dayweek'].setValue([date.getDay().toString()]);
            this.formGroup.controls[this.preTaskName + '_daymonth'].setValue(date.getDate().toString());
            this.formGroup.controls[this.preTaskName + '_hour'].setValue(date.getHours().toString());
            if (this.mintue_field) {
              this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
            }
          }
        } else if (res == 'hourly') {
          this.month_field['isHidden'] = true;
          this.day_field['isHidden'] = true;
          this.daymonth_field['isHidden'] = true;
          this.hour_field['isHidden'] = true;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew && this.mintue_field) {
            this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'daily') {
          this.month_field['isHidden'] = true;
          this.day_field['isHidden'] = true;
          this.daymonth_field['isHidden'] = true;
          this.hour_field['isHidden'] = false;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew) {
            this.formGroup.controls[this.preTaskName + '_hour'].setValue(date.getHours().toString());
            if (this.mintue_field) {
              this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
            }
          }
        } else if (res == 'weekly') {
          this.month_field['isHidden'] = true;
          this.day_field['isHidden'] = false;
          this.daymonth_field['isHidden'] = true;
          this.hour_field['isHidden'] = false;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew) {
            this.formGroup.controls[this.preTaskName + '_dayweek'].setValue([date.getDay().toString()]);
            this.formGroup.controls[this.preTaskName + '_hour'].setValue(date.getHours().toString());
            if (this.mintue_field) {
              this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
            }
          }
        } else if (res == 'monthly') {
          this.month_field['isHidden'] = true;
          this.day_field['isHidden'] = true;
          this.daymonth_field['isHidden'] = false;
          this.hour_field['isHidden'] = false;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew) {
            this.formGroup.controls[this.preTaskName + '_daymonth'].setValue(date.getDate().toString());
            this.formGroup.controls[this.preTaskName + '_hour'].setValue(date.getHours().toString());
            if (this.mintue_field) {
              this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
            }
          }
        }
      });
    });

    if (!this.isNew) {
      this.showDefaults = true;
    }

    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }

    setTimeout(() => { this.setShowDefaults(); }, 500);
  }

  setShowDefaults(): void {
    this.showDefaults = true;
  }

  isShow(name: any): any {
    if (this.conf.hide_fileds !== undefined) {
      if (this.conf.hide_fileds.indexOf(name) > -1) {
        return false;
      }
    }
    return true;
  }

  goBack(): void {
    this.router.navigate(new Array('').concat(this.conf.route_success));
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    const value = _.cloneDeep(this.formGroup.value);

    if (value[this.preTaskName + '_repeat'] == 'hourly') {
      value[this.preTaskName + '_dayweek'] = '*';
      value[this.preTaskName + '_month'] = '*';
      value[this.preTaskName + '_daymonth'] = '*';
      value[this.preTaskName + '_hour'] = '*';
    } else if (value[this.preTaskName + '_repeat'] == 'daily') {
      value[this.preTaskName + '_dayweek'] = '*';
      value[this.preTaskName + '_month'] = '*';
      value[this.preTaskName + '_daymonth'] = '*';
    } else if (value[this.preTaskName + '_repeat'] == 'weekly') {
      value[this.preTaskName + '_month'] = '*';
      value[this.preTaskName + '_daymonth'] = '*';
    } else if (value[this.preTaskName + '_repeat'] == 'monthly') {
      value[this.preTaskName + '_dayweek'] = '*';
      value[this.preTaskName + '_month'] = '*';
    }

    this.loader.open();
    // if we want to use this we will need to convert to websocket
    /* if (this.isNew) {
      this.rest.post(this.conf.resource_name + '/', {
        body: JSON.stringify(value)
      }).pipe(untilDestroyed(this)).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.conf.route_success));
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        });
    } else {
      this.rest.put(this.conf.resource_name + '/' + this.pk, {
        body: JSON.stringify(value)
      }).pipe(untilDestroyed(this)).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.conf.route_success));
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        });
    } */
  }
}
