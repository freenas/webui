import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService, NetworkService, SystemGeneralService } from '../../../services';
import { FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import { MessageService } from '../../common/entity/entity-form/services/message.service';
import * as _ from 'lodash';

import { VmService } from '../../../services/vm.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';
import { T } from '../../../translate-marker';
import { DialogService } from '../../../services/dialog.service';
import helptext from '../../../helptext/vm/vm-wizard/vm-wizard';
import add_edit_helptext from '../../../helptext/vm/devices/device-add-edit';
import { filter, map } from 'rxjs/operators';
import { EntityUtils } from 'app/pages/common/entity/utils';

@Component({
  selector: 'app-vm-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers : [ VmService ]
})
export class VMWizardComponent {

  protected addWsCall = 'vm.create';
  public route_success: string[] = ['vm'];
  public summary = {};
  isLinear = true;
  firstFormGroup: FormGroup;
  protected dialogRef: any;
  objectKeys = Object.keys;
  summary_title = "VM Summary";

  entityWizard: any;
  public res;

  protected wizardConfig: Wizard[] = [
    {
      label: helptext.os_label,
      fieldConfig: [
        {
          type: 'select',
          name: 'os',
          required: true,
          placeholder: helptext.os_placeholder,
          tooltip: helptext.os_tooltip,
          options: helptext.os_options,
          validation : helptext.os_validation,
        },
      { type: 'input',
        name : 'name',
        placeholder : helptext.name_placeholder,
        tooltip : helptext.name_tooltip,
        validation : [Validators.required,Validators.pattern('^[a-zA-Z0-9\_]*$')],
        required: true,
        blurStatus: true,
        blurEvent: this.blurEvent,
        parent: this
      },
      { type: 'input',
        name : 'description',
        placeholder : helptext.description_placeholder,
        tooltip : helptext.description_tooltip,
      },
      {
        name: 'time',
        type: 'select',
        placeholder: helptext.time_placeholder,
        tooltip: helptext.time_tooltip,
        validation: [Validators.required],
        required: true,
        value: 'LOCAL',
        options: [{ label: helptext.time_local_text, value: 'LOCAL' }, { label: 'UTC', value: 'UTC' }]
      },
      { type: 'select',
        name : 'bootloader',
        placeholder : helptext.bootloader_placeholder,
        tooltip : helptext.bootloader_tooltip,
        options: []
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : helptext.autostart_placeholder,
        tooltip : helptext.autostart_tooltip,
        value: true
      },
      { type: 'checkbox',
      name : 'enable_vnc',
      placeholder : helptext.enable_vnc_placeholder,
      tooltip : helptext.enable_vnc_tooltip,
      value: true,
      isHidden: false
      },
      {
        name : 'wait',
        placeholder : add_edit_helptext.wait_placeholder,
        tooltip : add_edit_helptext.wait_tooltip,
        type: 'checkbox',
        value: false
      },
      {
        type: 'select',
        name : 'vnc_bind',
        placeholder : helptext.vnc_bind_placeholder,
        tooltip : helptext.vnc_bind_tooltip,
        options: [],
        required: true,
        validation: [Validators.required],
      },
      ]
    },
    {
      label: helptext.vcpus_label,
      fieldConfig: [{
          type: 'input',
          name: 'vcpus',
          placeholder: helptext.vcpus_placeholder,
          inputType: 'number',
          min: 1,
          validation : [ Validators.required, Validators.min(1), Validators.max(16) ],
          tooltip: helptext.vcpus_tooltip,
        },
        {
          type: 'paragraph',
          name: 'memory_limitation',
          paraText: helptext.memory_limitation + ' 0 MB'
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: helptext.memory_placeholder,
          inputType: 'number',
          min: 128,
          validation : helptext.memory_validation,
          required: true,
          blurStatus: true,
          blurEvent: this.blurEvent2,
          parent: this,
          tooltip: helptext.memory_tooltip,
        },
      ]
    },
    {
      label: helptext.disks_label,
      fieldConfig: [
        {
          type: 'radio',
          name: 'disk_radio',
          tooltip: helptext.disk_radio_tooltip,
          options: helptext.disk_radio_options,
          value: true,
        },
        {
          type: 'select',
          name: 'hdd_type',
          placeholder: helptext.hdd_type_placeholder,
          tooltip: helptext.hdd_type_tooltip,
          options : helptext.hdd_type_options,
          value: helptext.hdd_type_value
        },
        {
          type: 'input',
          name: 'volsize',
          placeholder : helptext.volsize_placeholder,
          tooltip: helptext.volsize_tooltip,
          isHidden: false,
          blurStatus: true,
          blurEvent: this.blurEvent3,
          parent: this,
          validation: helptext.volsize_validation,
          required: true
        },
        {
          type: 'select',
          name: 'datastore',
          tooltip: helptext.datastore_tooltip,
          placeholder: helptext.datastore_placeholder,
          blurStatus: true,
          blurEvent: this.blurEvent3,
          options: [],
          isHidden: false,
          validation: [Validators.required],
          required: true
        },
        {
          type: 'select',
          name: 'hdd_path',
          placeholder: helptext.hdd_path_placeholder,
          tooltip: helptext.hdd_path_tooltip,
          isHidden: true,
          options:[]
        },
      ]
    },
    {
      label: helptext.NIC_label,
      fieldConfig: [
        {
          name : 'NIC_type',
          placeholder : helptext.NIC_type_placeholder,
          tooltip : helptext.NIC_type_tooltip,
          type: 'select',
          options : [],
          validation : helptext.NIC_type_validation,
          required: true,
        },
        {
          name : 'NIC_mac',
          placeholder : helptext.NIC_mac_placeholder,
          tooltip : helptext.NIC_mac_tooltip,
          type: 'input',
          value : helptext.NIC_mac_value,
          validation : helptext.NIC_mac_validation,
        },
        {
          name : 'nic_attach',
          placeholder : helptext.nic_attach_placeholder,
          tooltip : helptext.nic_attach_tooltip,
          type: 'select',
          options : [],
          validation : helptext.nic_attach_validation,
          required: true,
        },
      ]
    },
    {
      label: helptext.media_label,
      fieldConfig: [
        {
          type: 'explorer',
          name: 'iso_path',
          placeholder : helptext.iso_path_placeholder,
          initial: '/mnt',
          tooltip: helptext.iso_path_tooltip,
        },
        {
          type: 'checkbox',
          name: 'upload_iso_checkbox',
          placeholder : helptext.upload_iso_checkbox_placeholder,
          tooltip: helptext.upload_iso_checkbox_tooltip,
          value: false,
        },
        {
          type: 'explorer',
          name: 'upload_iso_path',
          placeholder : helptext.upload_iso_path_placeholder,
          initial: '/mnt',
          tooltip: helptext.upload_iso_path_tooltip,
          explorerType: 'directory',
          isHidden: true,
        },
        {
          type: 'upload',
          name: 'upload_iso',
          placeholder : helptext.upload_iso_placeholder,
          tooltip: helptext.upload_iso_tooltip,
          isHidden: true,
          acceptedFiles: '.img,.iso',
          fileLocation: '',
          validation : helptext.upload_iso_validation,
          message: this.messageService
        },
      ]
    },
  ]

  protected releaseField: any;
  protected currentServerVersion: any;
  private nic_attach: any;
  private nicType:  any;
  private bootloader: any;

  constructor(protected rest: RestService, protected ws: WebSocketService,
    public vmService: VmService, public networkService: NetworkService,
    protected loader: AppLoaderService, protected dialog: MatDialog,
    public messageService: MessageService,private router: Router,
    private dialogService: DialogService, private systemGeneralService: SystemGeneralService) {

  }

  preInit(entityWizard: EntityWizardComponent){
    this.entityWizard = entityWizard;
  }
  afterInit(entityWizard: EntityWizardComponent) {
    this.systemGeneralService.getIPChoices().subscribe((res) => {
      if (res.length > 0) {
        const vnc_bind = _.find(this.wizardConfig[0].fieldConfig, {'name' : 'vnc_bind'});
        for (const item of res){
          vnc_bind.options.push({label : item[1], value : item[0]});
        }
        this.ws.call('interface.ip_in_use', [{"ipv4": true}]).subscribe(
          (ip) => {
            if (_.find(vnc_bind.options, { value: ip[0].address })){
              ( < FormGroup > entityWizard.formArray.get([0]).get('vnc_bind')).setValue(ip[0].address);
            }
          }
        )
      }
    });

    this.ws
      .call("pool.filesystem_choices", [["FILESYSTEM"]])
      .pipe(map(new EntityUtils().array1DToLabelValuePair))
      .subscribe(options => {
        this.wizardConfig[2].fieldConfig.find(config => config.name === "datastore").options = options;
      });

    /* Patch memory paraText with machine's available memory */
    this.ws
      .call("vm.get_available_memory", [])
      .pipe(filter(availableMemory => typeof availableMemory === "number" && availableMemory > 0))
      .subscribe(
        availableMemory => {
          this.wizardConfig
            .find(step => step.label === helptext.vcpus_label)
            .fieldConfig.find(config => config.type === "paragraph").paraText =
              helptext.memory_limitation + `: ${(window as any).filesize(availableMemory, { exponent: 2 })}`;
        },
        error => new EntityUtils().handleWSError(this, error, this.dialogService)
      );

    this.ws.call("pool.dataset.query",[[["type", "=", "VOLUME"]]]).subscribe((zvols)=>{
      zvols.forEach(zvol => {
        _.find(this.wizardConfig[2].fieldConfig, {name : 'hdd_path'}).options.push(
          {
            label : zvol.id, value : zvol.id
          }
        );
      });
    });

    ( < FormGroup > entityWizard.formArray.get([0]).get('bootloader')).valueChanges.subscribe((bootloader) => {
      if(bootloader === "UEFI_CSM"){
        _.find(this.wizardConfig[0].fieldConfig, {name : 'enable_vnc'})['isHidden'] = true;
        _.find(this.wizardConfig[0].fieldConfig, {name : 'wait'})['isHidden'] = true;

      } else {
        _.find(this.wizardConfig[0].fieldConfig, {name : 'enable_vnc'})['isHidden'] = false;
        _.find(this.wizardConfig[0].fieldConfig, {name : 'wait'})['isHidden'] = false;

      }


    });

    ( < FormGroup > entityWizard.formArray.get([0]).get('enable_vnc')).valueChanges.subscribe((res) => {
      _.find(this.wizardConfig[0].fieldConfig, {name : 'wait'}).isHidden = !res;
      _.find(this.wizardConfig[0].fieldConfig, {name : 'vnc_bind'}).isHidden = !res;
      if (res) {
        ( < FormGroup > entityWizard.formArray.get([0]).get('wait')).enable();
        ( < FormGroup > entityWizard.formArray.get([0]).get('vnc_bind')).enable()
      } else {
        ( < FormGroup > entityWizard.formArray.get([0]).get('wait')).disable();
        ( < FormGroup > entityWizard.formArray.get([0]).get('vnc_bind')).disable();
      }
    });


    ( < FormGroup > entityWizard.formArray.get([0]).get('os')).valueChanges.subscribe((res) => {
      this.summary[T('Guest Operating System')] = res;
      ( < FormGroup > entityWizard.formArray.get([0])).get('name').valueChanges.subscribe((name) => {
        this.summary[T('Name')] = name;
      });
      ( < FormGroup > entityWizard.formArray.get([1])).get('vcpus').valueChanges.subscribe((vcpus) => {
        this.summary[T('Number of CPUs')] = vcpus;
      });
      ( < FormGroup > entityWizard.formArray.get([1])).get('memory').valueChanges.subscribe((memory) => {
        this.summary[T('Memory')] = memory + ' MiB';
      });

      ( < FormGroup > entityWizard.formArray.get([2])).get('volsize').valueChanges.subscribe((volsize) => {
        this.summary[T('Hard Disk Size')] = volsize + ' GiB';
      });

      ( < FormGroup > entityWizard.formArray.get([2])).get('disk_radio').valueChanges.subscribe((disk_radio)=>{
        if(this.summary[T('Hard Disk')] || this.summary[T('Hard Disk Size')]){
          delete this.summary[T('Hard Disk')];
          delete this.summary[T('Hard Disk Size')];
        }
        if(disk_radio) {
          this.summary[T('Hard Disk Size')] = ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].value + ' Gib';
            ( < FormGroup > entityWizard.formArray.get([2])).get('volsize').valueChanges.subscribe((volsize) => {
              this.summary[T('Hard Disk Size')] = volsize + ' GiB';
            });
        } else {
          this.summary[T('Hard Disk')] = ( < FormGroup > entityWizard.formArray.get([2])).controls['hdd_path'].value;
            ( < FormGroup > entityWizard.formArray.get([2])).get('hdd_path').valueChanges.subscribe((existing_hdd_path)=>{
              this.summary[T('Hard Disk')] = existing_hdd_path;
            })
        }
      });

      ( < FormGroup > entityWizard.formArray.get([2])).get('datastore').valueChanges.subscribe((datastore)=>{
        if(datastore !== undefined && datastore !== "" && datastore !== "/mnt"){
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).hasErrors = false;
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).errors = null;
        const volsize = ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].value * 1073741824;
        this.ws.call('filesystem.statfs',[`/mnt/${datastore}`]).subscribe((stat)=> {
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'volsize'})['hasErrors'] = false;
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'volsize'})['errors'] = '';
         if (stat.free_bytes < volsize ) {
          ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(Math.floor(stat.free_bytes / (1073741824)));
         } else if (stat.free_bytes > 40*1073741824) {
              const vm_os = ( < FormGroup > entityWizard.formArray.get([0]).get('os')).value;
              if (vm_os === "Windows"){
                  ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(volsize/1073741824);
              } else {
                  ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(volsize/1073741824);
              };
        } else if (stat.free_bytes > 10*1073741824) {
              const vm_os = ( < FormGroup > entityWizard.formArray.get([0]).get('os')).value;
              ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(volsize/1073741824);
          };
        });
      } else {
        if(datastore === '/mnt'){
          ( < FormGroup > entityWizard.formArray.get([2])).controls['datastore'].setValue(null);
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).hasErrors = true;
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).errors = `Virtual machines cannot be stored in an unmounted mountpoint: ${datastore}`;
        }
        if(datastore === ''){
          ( < FormGroup > entityWizard.formArray.get([2])).controls['datastore'].setValue(null);
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).hasErrors = true;
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'datastore'}).errors = `Please select a valid path`;
        }
      }
      });
      ( < FormGroup > entityWizard.formArray.get([4]).get('iso_path')).valueChanges.subscribe((iso_path) => {
        if (iso_path && iso_path !== undefined){
          this.summary[T('Installation Media')] = iso_path;
        } else {
          delete this.summary[T('Installation Media')];
        }
        
      });
      this.messageService.messageSourceHasNewMessage$.subscribe((message)=>{
        ( < FormGroup > entityWizard.formArray.get([4]).get('iso_path')).setValue(message);
      })
      this.ws.call('vm.get_available_memory').subscribe((available_memory)=>{
        if (available_memory > 512 * 1048576) {
          this.res = res;
          if (res === 'Windows') {
            ( < FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(2);
            ( < FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue(4096);
            ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(40);
          }
          else {
            ( < FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(1);
            ( < FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue(512);
            ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(10);
          }

        } else {
          if (res === 'Windows') {
            ( < FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(2);
            ( < FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue(0);
            ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(40);
          }
          else {
            ( < FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(1);
            ( < FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue(0);
            ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(10);
          }

        }
      })

    });
    ( < FormGroup > entityWizard.formArray.get([2]).get('disk_radio')).valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[2].fieldConfig, {name : 'volsize'}).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'datastore'}).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'hdd_path'}).isHidden = true;
      } else {
        _.find(this.wizardConfig[2].fieldConfig, {name : 'volsize'}).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'datastore'}).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'hdd_path'}).isHidden = false;
      }

    });
    ( < FormGroup > entityWizard.formArray.get([4]).get('upload_iso_checkbox')).valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso'})['isHidden'] = false;
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso_path'})['isHidden'] = false;
      } else {
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso'})['isHidden'] = true;
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso_path'})['isHidden'] = true;
      }

    });
    ( < FormGroup > entityWizard.formArray.get([4]).get('upload_iso_path')).valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso'}).fileLocation = res;
      }

    });

    this.networkService.getVmNicChoices().subscribe((res) => {
      this.nic_attach = _.find(this.wizardConfig[3].fieldConfig, {'name' : 'nic_attach'});
      this.nic_attach.options = Object.keys(res || {}).map(nicId => ({
        label: nicId,
        value: nicId
      }));
      ( < FormGroup > entityWizard.formArray.get([3])).controls['nic_attach'].setValue(
        this.nic_attach.options[0].value
      )
      this.ws.call('vm.random_mac').subscribe((mac_res)=>{
        ( < FormGroup > entityWizard.formArray.get([3])).controls['NIC_mac'].setValue(mac_res);
      });

    });
    this.ws.call('notifier.choices', [ 'VM_NICTYPES' ]).subscribe((res) => {
          this.nicType = _.find(this.wizardConfig[3].fieldConfig, {name : "NIC_type"});
          res.forEach((item) => {
            this.nicType.options.push({label : item[1], value : item[0]});
          });
        ( < FormGroup > entityWizard.formArray.get([3])).controls['NIC_type'].setValue(
          this.nicType.options[0].value
        )
        });

      this.ws.call('notifier.choices', [ 'VM_BOOTLOADER' ]).subscribe((res) => {
        this.bootloader = _.find(this.wizardConfig[0].fieldConfig, {name : 'bootloader'});
        res.forEach((item) => {
          this.bootloader.options.push({label : item[1], value : item[0]})
        });
      ( < FormGroup > entityWizard.formArray.get([0])).controls['bootloader'].setValue(
        this.bootloader.options[0].value
      )
      });
  }
  getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
blurEvent(parent){
  const vm_name = parent.entityWizard.formGroup.value.formArray[1].name
  parent.ws.call('vm.query', [[["name","=",vm_name]]]).subscribe((vm_wizard_res)=>{
    if(vm_wizard_res.length > 0){
      _.find(parent.wizardConfig[0].fieldConfig, {'name' : 'name'})['hasErrors'] = true;
      _.find(parent.wizardConfig[0].fieldConfig, {'name' : 'name'})['errors'] = `Virtual machine ${vm_wizard_res[0].name} already exists.`;
      parent.entityWizard.formArray.get([0]).get('name').setValue("");

    }
  })
}

blurEvent2(parent){
  const vm_memory_requested = parent.entityWizard.formGroup.value.formArray[2].memory
  const vm_name = parent.entityWizard.formGroup.value.formArray[1].name
  parent.ws.call('vm.get_available_memory').subscribe((vm_memory_available)=>{
    if( vm_memory_requested *1048576> vm_memory_available){
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['hasErrors'] = true;
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = `Cannot allocate ${vm_memory_requested} Mib to virtual machine: ${vm_name}.`;
      parent.entityWizard.formArray.get([1]).get('memory').setValue(0);
    } else{
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['hasErrors'] = false;
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = '';
    }
  })
}
blurEvent3(parent){
  if(parent.entityWizard.formArray.controls[3].value.volsize > 0 ) {
    const volsize = parent.entityWizard.formArray.controls[3].value.volsize * 1073741824;
    const datastore = parent.entityWizard.formArray.controls[3].value.datastore;
    const vm_name = parent.entityWizard.formGroup.value.formArray[1].name;
    if(datastore !== undefined && datastore !== "" && datastore !== "/mnt"){
    parent.ws.call('filesystem.statfs', [`/mnt/${datastore}`]).subscribe((stat)=> {
      if (stat.free_bytes < volsize ) {
        _.find(parent.wizardConfig[3].fieldConfig, {'name' : 'volsize'})['hasErrors'] = true;
        _.find(parent.wizardConfig[3].fieldConfig, {'name' : 'volsize'})['errors'] = `Cannot allocate ${volsize / (1073741824)} Gib to for storage virtual machine: ${vm_name}.`;
        parent.entityWizard.formArray.get([2]).get('volsize').setValue(0);
       } else {
        _.find(parent.wizardConfig[3].fieldConfig, {'name' : 'volsize'})['hasErrors'] = false;
        _.find(parent.wizardConfig[3].fieldConfig, {'name' : 'volsize'})['errors'] = '';
        const vm_os = parent.entityWizard.formArray.controls[1].os;
        if (vm_os === "Windows"){
          parent.entityWizard.formArray.get([2]).get('volsize').setValue(volsize/1073741824);
        } else {
          parent.entityWizard.formArray.get([2]).get('volsize').setValue(volsize/1073741824);
        };
       }
    })
  }
}
}

async customSubmit(value) {
    value.datastore = value.datastore.replace('/mnt/','')
    const hdd = value.datastore+"/"+value.name.replace(/\s+/g, '-')+"-"+Math.random().toString(36).substring(7);
    const vm_payload = {}
    const zvol_payload = {}

    // zvol_payload only applies if the user is creating one
    zvol_payload['create_zvol'] = true
    zvol_payload["zvol_name"] = hdd
    zvol_payload["zvol_volsize"] = value.volsize * 1024 * 1000 * 1000;

    vm_payload["memory"]= value.memory;
    vm_payload["name"] = value.name;
    vm_payload["description"] = value.description;
    vm_payload["time"]= value.time;
    vm_payload["vcpus"] = value.vcpus;
    vm_payload["memory"] = value.memory;
    vm_payload["bootloader"] = value.bootloader;
    vm_payload["autoloader"] = value.autoloader;
    vm_payload["autostart"] = value.autostart;
    if ( value.iso_path && value.iso_path !== undefined) {
      vm_payload["devices"] = [
        {"dtype": "NIC", "attributes": {"type": value.NIC_type, "mac": value.NIC_mac, "nic_attach":value.nic_attach}},
        {"dtype": "DISK", "attributes": {"path": hdd, "type": value.hdd_type, "sectorsize": 0}},
        {"dtype": "CDROM", "attributes": {"path": value.iso_path}},
      ]
    } else {
      vm_payload["devices"] = [
        {"dtype": "NIC", "attributes": {"type": value.NIC_type, "mac": value.NIC_mac, "nic_attach":value.nic_attach}},
        {"dtype": "DISK", "attributes": {"path": hdd, "type": value.hdd_type, "sectorsize": 0}},
      ]
    }
    
    if(value.enable_vnc &&value.bootloader !== "UEFI_CSM"){
      vm_payload["devices"].push({
          "dtype": "VNC", "attributes": {
            "wait": value.wait,
            "vnc_port": String(this.getRndInteger(5553,6553)),
            "vnc_resolution": "1024x768",
            "vnc_bind": value.vnc_bind,
            "vnc_password": "",
            "vnc_web": true
          }
        });
    };
    this.loader.open();
    if( value.hdd_path ){
      for (const device of vm_payload["devices"]){
        if (device.dtype === "DISK"){
          device.attributes.path = '/dev/zvol/'+ value.hdd_path;
        };
      };
      this.ws.call('vm.create', [vm_payload]).subscribe(vm_res => {
        this.loader.close();
        this.router.navigate(['/vm']);
    },(error) => {
      this.loader.close();
      this.dialogService.errorReport(T("Error creating VM."), error.reason, error.trace.formatted);
    });

    } else {
      for (const device of vm_payload["devices"]){
        if (device.dtype === "DISK"){          
          const orig_hdd = device.attributes.path;
          const create_zvol = zvol_payload['create_zvol']
          const zvol_name = zvol_payload['zvol_name']
          const zvol_volsize = zvol_payload['zvol_volsize']

          device.attributes.path = '/dev/zvol/' + orig_hdd
          device.attributes.type = value.hdd_type;
          device.attributes.create_zvol = create_zvol
          device.attributes.zvol_name = zvol_name
          device.attributes.zvol_volsize = zvol_volsize
        };
      };
      this.ws.call('vm.create', [vm_payload]).subscribe(vm_res => {
        this.loader.close();
        this.router.navigate(['/vm']);
      },(error) => {
        this.loader.close();
        this.dialogService.errorReport(T("Error creating VM."), error.reason, error.trace.formatted);
      });
    }
}

}
