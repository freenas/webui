import {ApplicationRef, Component, Injector} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

import helptext from './../../../helptext/vm/vm-wizard/vm-wizard';
import globalHelptext from './../../../helptext/global-helptext';
import {RestService, WebSocketService, StorageService} from '../../../services/';

@Component({
  selector : 'app-vm',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [StorageService]

})
export class VmFormComponent {

  protected resource_name = 'vm/vm';
  protected isEntity = true;
  protected route_success: string[] = [ 'vm' ];
  protected entityForm: any;
  protected save_button_enabled: boolean;

  public fieldConfig: FieldConfig[] = [
    { type: 'input', name: 'name', placeholder: helptext.name_placeholder, tooltip: helptext.name_tooltip},
    { type: 'input', name : 'description', placeholder : helptext.description_placeholder, tooltip: helptext.description_tooltip},
    {
      name: 'time',
      placeholder: helptext.time_placeholder,
      tooltip: helptext.time_tooltip,
      type: 'select',
      options: [{ label: helptext.time_local_text, value: 'LOCAL'}, { label: helptext.time_utc_text, value: 'UTC' }]
    },
    { type : 'input', name: 'vcpus'  ,placeholder : helptext.vcpus_placeholder, tooltip: helptext.vcpus_tooltip},
    { type: 'input', name : 'memory', 
      placeholder : `${helptext.memory_placeholder} ${globalHelptext.human_readable.suggestion_label}`,
      tooltip: helptext.memory_tooltip,
      blurStatus : true,
      blurEvent : this.blurEvent,
      parent : this
    },
    { type: 'select', name : 'bootloader', placeholder : helptext.bootloader_placeholder, tooltip: helptext.bootloader_tooltip,options: []},
    { type: 'checkbox', name : 'autostart', placeholder : helptext.autostart_placeholder, tooltip: helptext.autostart_tooltip}

  ];
  private bootloader: any;
  public bootloader_type: any[];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected storageService: StorageService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    entityForm.ws.call('notifier.choices', [ 'VM_BOOTLOADER' ]).subscribe((res) => {
      this.bootloader =_.find(this.fieldConfig, {name : 'bootloader'});
      for (let item of res){
        this.bootloader.options.push({label : item[1], value : item[0]})
      }
    });

    entityForm.formGroup.controls['memory'].valueChanges.subscribe((value) => {
      const mem = _.find(this.fieldConfig, {name: "memory"});
      if (typeof(value) === 'number') {
        value = value.toString();
      }
      const filteredValue = this.storageService.convertHumanStringToNum(value);
      mem['hasErrors'] = false;
      mem['errors'] = '';
      if (isNaN(filteredValue)) {
          mem['hasErrors'] = true;
          mem['errors'] = globalHelptext.human_readable.input_error;
      };
    });
  }

  blurEvent(parent){
    if (parent.entityForm) {
      parent.entityForm.formGroup.controls['memory'].setValue(parent.storageService.humanReadable)
      let valString = (parent.entityForm.formGroup.controls['memory'].value);
      let valBytes = Math.round(parent.storageService.convertHumanStringToNum(valString)/1048576);
      if (valBytes < 256) {
        const mem = _.find(parent.fieldConfig, {name: "memory"});
        mem['hasErrors'] = true;
        mem['errors'] = helptext.memory_size_err;
      }
    }
  }

  resourceTransformIncomingRestData(wsResponse) {
    wsResponse['memory'] = this.storageService.convertBytestoHumanReadable(wsResponse['memory']*1048576, 0);
    return wsResponse;
  }

  beforeSubmit(data) {
    if (data['memory'] !== undefined && data['memory'] !== null) {
    data['memory'] = Math.round(this.storageService.convertHumanStringToNum(data['memory'])/1048576);
    }
  }

}
