import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PreferencesService } from 'app/core/services/preferences.service';
import {
  FormGroup, Validators, ValidationErrors, FormControl,
} from '@angular/forms';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { filter, map } from 'rxjs/operators';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import {
  RestService, WebSocketService, NetworkService, StorageService,
} from '../../../services';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import { MessageService } from '../../common/entity/entity-form/services/message.service';

import { VmService } from '../../../services/vm.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { T } from '../../../translate-marker';
import { DialogService } from '../../../services/dialog.service';
import helptext from '../../../helptext/vm/vm-wizard/vm-wizard';
import add_edit_helptext from '../../../helptext/vm/devices/device-add-edit';
import globalHelptext from '../../../helptext/global-helptext';

@Component({
  selector: 'app-vm-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers: [VmService],
})
export class VMWizardComponent {
  protected addWsCall = 'vm.create';
  route_success: string[] = ['vm'];
  summary = {};
  isLinear = true;
  firstFormGroup: FormGroup;
  protected dialogRef: any;
  objectKeys = Object.keys;
  summary_title = T('VM Summary');
  namesInUse = [];
  statSize: any;
  vcpus = 1;
  cores = 1;
  threads = 1;

  entityWizard: any;
  res;

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
          validation: helptext.os_validation,
        },
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.name_placeholder,
          tooltip: helptext.name_tooltip,
          validation: [Validators.required, Validators.pattern('^[a-zA-Z0-9\_]*$'), forbiddenValues(this.namesInUse)],
          required: true,
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.description_placeholder,
          tooltip: helptext.description_tooltip,
        },
        {
          name: 'time',
          type: 'select',
          placeholder: helptext.time_placeholder,
          tooltip: helptext.time_tooltip,
          validation: [Validators.required],
          required: true,
          value: 'LOCAL',
          options: [{ label: helptext.time_local_text, value: 'LOCAL' }, { label: 'UTC', value: 'UTC' }],
        },
        {
          type: 'select',
          name: 'bootloader',
          placeholder: helptext.bootloader_placeholder,
          tooltip: helptext.bootloader_tooltip,
          options: [],
        },
        {
          type: 'input',
          name: 'shutdown_timeout',
          inputType: 'number',
          value: 90,
          placeholder: helptext.shutdown_timeout.placeholder,
          tooltip: helptext.shutdown_timeout.tooltip,
          validation: helptext.shutdown_timeout.validation,
        },
        {
          type: 'checkbox',
          name: 'autostart',
          placeholder: helptext.autostart_placeholder,
          tooltip: helptext.autostart_tooltip,
          value: true,
        },
        {
          type: 'checkbox',
          name: 'enable_vnc',
          placeholder: helptext.enable_vnc_placeholder,
          tooltip: helptext.enable_vnc_tooltip,
          value: true,
          isHidden: false,
        },
        {
          name: 'wait',
          placeholder: add_edit_helptext.wait_placeholder,
          tooltip: add_edit_helptext.wait_tooltip,
          type: 'checkbox',
          value: false,
        },
        {
          type: 'select',
          name: 'vnc_bind',
          placeholder: helptext.vnc_bind_placeholder,
          tooltip: helptext.vnc_bind_tooltip,
          options: [],
          required: true,
          validation: [Validators.required],
        },
      ],
    },
    {
      label: helptext.vcpus_label,
      fieldConfig: [{
        type: 'input',
        name: 'vcpus',
        placeholder: helptext.vcpus_placeholder,
        inputType: 'number',
        min: 1,
        validation: [this.cpuValidator('threads'), Validators.required, Validators.min(1), Validators.max(16)],
        tooltip: helptext.vcpus_tooltip,
      },
      {
        type: 'input',
        name: 'cores',
        placeholder: helptext.cores.placeholder,
        inputType: 'number',
        validation: [this.cpuValidator('threads'), Validators.required, Validators.min(1), Validators.max(16)],
        tooltip: helptext.cores.tooltip,
      },
      {
        type: 'input',
        name: 'threads',
        placeholder: helptext.threads.placeholder,
        inputType: 'number',
        validation: [
          this.cpuValidator('threads'),
          Validators.required,
          Validators.min(1),
          Validators.max(16),
        ],
        tooltip: helptext.threads.tooltip,
      },
      {
        type: 'input',
        name: 'memory',
        placeholder: helptext.memory_placeholder,
        inputType: 'text',
        validation: [
          ...helptext.memory_validation,
          this.memoryValidator('memory'),
          (control: FormControl): ValidationErrors => {
            const config = this.wizardConfig.find((c) => c.label === helptext.vcpus_label).fieldConfig.find((c) => c.name === 'memory');
            const errors = control.value && isNaN(this.storageService.convertHumanStringToNum(control.value))
              ? { invalid_byte_string: true }
              : null;

            if (errors) {
              config.hasErrors = true;
              config.errors = globalHelptext.human_readable.input_error;
            } else {
              config.hasErrors = false;
              config.errors = '';
            }

            return errors;
          },
        ],
        value: '',
        required: true,
        blurStatus: true,
        blurEvent: this.blurEvent2,
        parent: this,
        tooltip: helptext.memory_tooltip,
      },
      {
        type: 'paragraph',
        name: 'memory_warning',
        paraText: helptext.memory_warning,
      },
      ],
    },
    {
      label: helptext.disks_label,
      fieldConfig: [
        {
          type: 'radio',
          name: 'disk_radio',
          options: [
            {
              label: helptext.disk_radio_options_new_label,
              value: true,
              tooltip: helptext.disk_radio_tooltip,
            },
            {
              label: helptext.disk_radio_options_existing_label,
              value: false,
            },
          ],
          value: true,
        },
        {
          type: 'select',
          name: 'hdd_type',
          placeholder: helptext.hdd_type_placeholder,
          tooltip: helptext.hdd_type_tooltip,
          options: helptext.hdd_type_options,
          value: helptext.hdd_type_value,
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
          required: true,
        },
        {
          type: 'input',
          name: 'volsize',
          inputType: 'text',
          placeholder: helptext.volsize_placeholder,
          tooltip: helptext.volsize_tooltip,
          isHidden: false,
          blurStatus: true,
          blurEvent: this.blurEvent3,
          parent: this,
          validation: [
            ...helptext.volsize_validation,
            this.volSizeValidator('volsize'),
            (control: FormControl): ValidationErrors => {
              const config = this.wizardConfig.find((c) => c.label === helptext.disks_label).fieldConfig.find((c) => c.name === 'volsize');
              const errors = control.value && isNaN(this.storageService.convertHumanStringToNum(control.value, false, 'mgtp'))
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                config.hasErrors = false;
                config.errors = '';
              }

              return errors;
            },
          ],
          relation: [
            {
              action: 'DISABLE',
              when: [{
                name: 'datastore',
                value: undefined,
              }],
            },
          ],
          required: true,
        },
        {
          type: 'select',
          name: 'hdd_path',
          placeholder: helptext.hdd_path_placeholder,
          tooltip: helptext.hdd_path_tooltip,
          isHidden: true,
          options: [],
        },
      ],
    },
    {
      label: helptext.NIC_label,
      fieldConfig: [
        {
          name: 'NIC_type',
          placeholder: helptext.NIC_type_placeholder,
          tooltip: helptext.NIC_type_tooltip,
          type: 'select',
          options: [],
          validation: helptext.NIC_type_validation,
          required: true,
        },
        {
          name: 'NIC_mac',
          placeholder: helptext.NIC_mac_placeholder,
          tooltip: helptext.NIC_mac_tooltip,
          type: 'input',
          value: helptext.NIC_mac_value,
          validation: helptext.NIC_mac_validation,
        },
        {
          name: 'nic_attach',
          placeholder: helptext.nic_attach_placeholder,
          tooltip: helptext.nic_attach_tooltip,
          type: 'select',
          options: [],
          validation: helptext.nic_attach_validation,
          required: true,
        },
      ],
    },
    {
      label: helptext.media_label,
      fieldConfig: [
        {
          type: 'explorer',
          name: 'iso_path',
          placeholder: helptext.iso_path_placeholder,
          initial: '/mnt',
          tooltip: helptext.iso_path_tooltip,
        },
        {
          type: 'checkbox',
          name: 'upload_iso_checkbox',
          placeholder: helptext.upload_iso_checkbox_placeholder,
          tooltip: helptext.upload_iso_checkbox_tooltip,
          value: false,
        },
        {
          type: 'explorer',
          name: 'upload_iso_path',
          placeholder: helptext.upload_iso_path_placeholder,
          initial: '/mnt',
          tooltip: helptext.upload_iso_path_tooltip,
          explorerType: 'directory',
          isHidden: true,
        },
        {
          type: 'upload',
          name: 'upload_iso',
          placeholder: helptext.upload_iso_placeholder,
          tooltip: helptext.upload_iso_tooltip,
          isHidden: true,
          acceptedFiles: '.img,.iso',
          fileLocation: '',
          validation: helptext.upload_iso_validation,
          message: this.messageService,
        },
      ],
    },
  ];

  protected releaseField: any;
  protected currentServerVersion: any;
  private nic_attach: any;
  private nicType: any;
  private bootloader: any;

  constructor(protected rest: RestService, protected ws: WebSocketService,
    public vmService: VmService, public networkService: NetworkService,
    protected loader: AppLoaderService, protected dialog: MatDialog,
    public messageService: MessageService, private router: Router,
    private dialogService: DialogService, private storageService: StorageService,
    protected prefService: PreferencesService, private translate: TranslateService) {

  }

  preInit(entityWizard: EntityWizardComponent) {
    this.entityWizard = entityWizard;
  }

  afterInit(entityWizard: EntityWizardComponent) {
    this.ws.call('vm.query').subscribe((res) => {
      res.forEach((i) => this.namesInUse.push(i.name));
    });

    this.ws.call('vm.device.vnc_bind_choices').subscribe((res) => {
      if (res && Object.keys(res).length > 0) {
        const vnc_bind = _.find(this.wizardConfig[0].fieldConfig, { name: 'vnc_bind' });
        Object.keys(res).forEach((address) => {
          vnc_bind.options.push({ label: address, value: address });
        });
        (< FormGroup > entityWizard.formArray.get([0]).get('vnc_bind')).setValue(res['0.0.0.0']);
      }
    });

    this.ws
      .call('pool.filesystem_choices', [['FILESYSTEM']])
      .pipe(map(new EntityUtils().array1DToLabelValuePair))
      .subscribe((options) => {
        this.wizardConfig[2].fieldConfig.find((config) => config.name === 'datastore').options = options;
      });

    this.ws.call('pool.dataset.query', [[['type', '=', 'VOLUME']]]).subscribe((zvols) => {
      zvols.forEach((zvol) => {
        _.find(this.wizardConfig[2].fieldConfig, { name: 'hdd_path' }).options.push(
          {
            label: zvol.id, value: zvol.id,
          },
        );
      });
    });

    (< FormGroup > entityWizard.formArray.get([0]).get('bootloader')).valueChanges.subscribe((bootloader) => {
      if (bootloader === 'UEFI_CSM') {
        _.find(this.wizardConfig[0].fieldConfig, { name: 'enable_vnc' })['isHidden'] = true;
        _.find(this.wizardConfig[0].fieldConfig, { name: 'wait' })['isHidden'] = true;
        _.find(this.wizardConfig[0].fieldConfig, { name: 'vnc_bind' }).isHidden = true;
      } else {
        _.find(this.wizardConfig[0].fieldConfig, { name: 'enable_vnc' })['isHidden'] = false;
        _.find(this.wizardConfig[0].fieldConfig, { name: 'wait' })['isHidden'] = false;
        _.find(this.wizardConfig[0].fieldConfig, { name: 'vnc_bind' }).isHidden = false;
      }
    });

    (< FormGroup > entityWizard.formArray.get([0]).get('enable_vnc')).valueChanges.subscribe((res) => {
      _.find(this.wizardConfig[0].fieldConfig, { name: 'wait' }).isHidden = !res;
      _.find(this.wizardConfig[0].fieldConfig, { name: 'vnc_bind' }).isHidden = !res;
      if (res) {
        (< FormGroup > entityWizard.formArray.get([0]).get('wait')).enable();
        (< FormGroup > entityWizard.formArray.get([0]).get('vnc_bind')).enable();
      } else {
        (< FormGroup > entityWizard.formArray.get([0]).get('wait')).disable();
        (< FormGroup > entityWizard.formArray.get([0]).get('vnc_bind')).disable();
      }
    });

    (< FormGroup > entityWizard.formArray.get([0]).get('os')).valueChanges.subscribe((res) => {
      this.summary[T('Guest Operating System')] = res;
      (< FormGroup > entityWizard.formArray.get([0])).get('name').valueChanges.subscribe((name) => {
        this.summary[T('Name')] = name;
      });
      (< FormGroup > entityWizard.formArray.get([1])).get('vcpus').valueChanges.subscribe((vcpus) => {
        this.vcpus = vcpus;
        this.summary[T('Number of CPUs')] = vcpus;
      });
      (< FormGroup > entityWizard.formArray.get([1])).get('cores').valueChanges.subscribe((cores) => {
        this.cores = cores;
        this.summary[T('Number of Cores')] = cores;
      });
      (< FormGroup > entityWizard.formArray.get([1])).get('threads').valueChanges.subscribe((threads) => {
        this.threads = threads;
        this.summary[T('Number of Threads')] = threads;
      });
      (< FormGroup > entityWizard.formArray.get([1])).get('memory').valueChanges.subscribe((memory) => {
        this.summary[T('Memory')] = isNaN(this.storageService.convertHumanStringToNum(memory))
          ? '0 MiB'
          : this.storageService.humanReadable;
      });

      (< FormGroup > entityWizard.formArray.get([2])).get('volsize').valueChanges.subscribe((volsize) => {
        this.summary[T('Disk Size')] = volsize;
      });

      (< FormGroup > entityWizard.formArray.get([2])).get('disk_radio').valueChanges.subscribe((disk_radio) => {
        if (this.summary[T('Disk')] || this.summary[T('Disk Size')]) {
          delete this.summary[T('Disk')];
          delete this.summary[T('Disk Size')];
        }
        if (disk_radio) {
          this.summary[T('Disk Size')] = (< FormGroup > entityWizard.formArray.get([2])).controls['volsize'].value;
          (< FormGroup > entityWizard.formArray.get([2])).get('volsize').valueChanges.subscribe((volsize) => {
            this.summary[T('Disk Size')] = volsize;
          });
        } else {
          this.summary[T('Disk')] = (< FormGroup > entityWizard.formArray.get([2])).controls['hdd_path'].value;
          (< FormGroup > entityWizard.formArray.get([2])).get('hdd_path').valueChanges.subscribe((existing_hdd_path) => {
            this.summary[T('Disk')] = existing_hdd_path;
          });
        }
      });

      (< FormGroup > entityWizard.formArray.get([2])).get('datastore').valueChanges.subscribe((datastore) => {
        if (datastore !== undefined && datastore !== '' && datastore !== '/mnt') {
          _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).hasErrors = false;
          _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).errors = null;
          const volsize = this.storageService.convertHumanStringToNum((< FormGroup > entityWizard.formArray.get([2])).controls['volsize'].value.toString());
          this.ws.call('filesystem.statfs', [`/mnt/${datastore}`]).subscribe((stat) => {
            this.statSize = stat;
            _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' })['hasErrors'] = false;
            _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' })['errors'] = '';
            if (stat.free_bytes < volsize) {
              (< FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(Math.floor(stat.free_bytes / (1073741824)));
            } else if (stat.free_bytes > 40 * 1073741824) {
              const vm_os = (< FormGroup > entityWizard.formArray.get([0]).get('os')).value;
              if (vm_os === 'Windows') {
                (< FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(this.storageService.convertBytestoHumanReadable(volsize, 0));
              } else {
                (< FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(this.storageService.convertBytestoHumanReadable(volsize, 0));
              }
            } else if (stat.free_bytes > 10 * 1073741824) {
              const vm_os = (< FormGroup > entityWizard.formArray.get([0]).get('os')).value;
              (< FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue((this.storageService.convertBytestoHumanReadable(volsize, 0)));
            }
          });
        } else {
          if (datastore === '/mnt') {
            (< FormGroup > entityWizard.formArray.get([2])).controls['datastore'].setValue(null);
            _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).hasErrors = true;
            _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).errors = T(`Virtual machines cannot be stored in an unmounted mountpoint: ${datastore}`);
          }
          if (datastore === '') {
            (< FormGroup > entityWizard.formArray.get([2])).controls['datastore'].setValue(null);
            _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).hasErrors = true;
            _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).errors = T('Please select a valid path');
          }
        }
      });
      (< FormGroup > entityWizard.formArray.get([3]).get('NIC_type')).valueChanges.subscribe((res) => {
        this.prefService.preferences.nicType = res;
      });
      (< FormGroup > entityWizard.formArray.get([3]).get('nic_attach')).valueChanges.subscribe((res) => {
        this.prefService.preferences.nicAttach = res;
      });
      (< FormGroup > entityWizard.formArray.get([4]).get('iso_path')).valueChanges.subscribe((iso_path) => {
        if (iso_path && iso_path !== undefined) {
          this.summary[T('Installation Media')] = iso_path;
        } else {
          delete this.summary[T('Installation Media')];
        }
      });
      this.messageService.messageSourceHasNewMessage$.subscribe((message) => {
        (< FormGroup > entityWizard.formArray.get([4]).get('iso_path')).setValue(message);
      });
      this.res = res;
      const grub = this.bootloader.options.find((o) => o.value === 'GRUB');
      const grubIndex = this.bootloader.options.indexOf(grub);
      if (res === 'Windows') {
        if (grub) {
          this.bootloader.options.splice(grubIndex, 1);
        }
        (< FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(2);
        (< FormGroup > entityWizard.formArray.get([1])).controls['cores'].setValue(1);
        (< FormGroup > entityWizard.formArray.get([1])).controls['threads'].setValue(1);
        (< FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue('4 GiB');
        (< FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue('40 GiB');
      } else {
        if (!grub) {
          this.bootloader.options.push({ label: 'Grub', value: 'GRUB' });
        }
        (< FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(1);
        (< FormGroup > entityWizard.formArray.get([1])).controls['cores'].setValue(1);
        (< FormGroup > entityWizard.formArray.get([1])).controls['threads'].setValue(1);
        (< FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue('512 MiB');
        (< FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue('10 GiB');
      }
    });
    (< FormGroup > entityWizard.formArray.get([2]).get('disk_radio')).valueChanges.subscribe((res) => {
      if (res) {
        _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' }).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, { name: 'hdd_path' }).isHidden = true;
        entityWizard.setDisabled('datastore', false, '2');
      } else {
        _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' }).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, { name: 'hdd_path' }).isHidden = false;
        entityWizard.setDisabled('datastore', true, '2');
      }
    });
    (< FormGroup > entityWizard.formArray.get([4]).get('upload_iso_checkbox')).valueChanges.subscribe((res) => {
      if (res) {
        _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso' })['isHidden'] = false;
        _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso_path' })['isHidden'] = false;
      } else {
        _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso' })['isHidden'] = true;
        _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso_path' })['isHidden'] = true;
      }
    });
    (< FormGroup > entityWizard.formArray.get([4]).get('upload_iso_path')).valueChanges.subscribe((res) => {
      if (res) {
        _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso' }).fileLocation = res;
      }
    });

    this.networkService.getVmNicChoices().subscribe((res) => {
      this.nic_attach = _.find(this.wizardConfig[3].fieldConfig, { name: 'nic_attach' });
      this.nic_attach.options = Object.keys(res || {}).map((nicId) => ({
        label: nicId,
        value: nicId,
      }));
      const tempNICAttach = (< FormGroup > entityWizard.formArray.get([3])).controls['nic_attach'];
      setTimeout(() => {
        if (!this.prefService.preferences.nicAttach) {
          tempNICAttach.setValue(this.nic_attach.options[0].value);
        } else {
          tempNICAttach.setValue(this.prefService.preferences.nicAttach);
        }
      }, 2000);

      this.ws.call('vm.random_mac').subscribe((mac_res) => {
        (< FormGroup > entityWizard.formArray.get([3])).controls['NIC_mac'].setValue(mac_res);
      });
    });
    this.nicType = _.find(this.wizardConfig[3].fieldConfig, { name: 'NIC_type' });
    this.vmService.getNICTypes().forEach((item) => {
      this.nicType.options.push({ label: item[1], value: item[0] });
    });

    const tempNICType = (< FormGroup > entityWizard.formArray.get([3])).controls['NIC_type'];
    setTimeout(() => {
      if (!this.prefService.preferences.nicType) {
        tempNICType.setValue(this.nicType.options[0].value);
      } else {
        tempNICType.setValue(this.prefService.preferences.nicType);
      }
    }, 2000);

    this.bootloader = _.find(this.wizardConfig[0].fieldConfig, { name: 'bootloader' });
    this.vmService.getBootloaderOptions().forEach((item) => {
      this.bootloader.options.push({ label: item[1], value: item[0] });
    });

    (< FormGroup > entityWizard.formArray.get([0])).controls['bootloader'].setValue(
      this.bootloader.options[0].value,
    );
    setTimeout(() => {
      let global_label; let
        global_tooltip;
      this.translate.get(helptext.memory_placeholder).subscribe((mem) => {
        this.translate.get(helptext.global_label).subscribe((gLabel) => {
          this.translate.get(helptext.global_tooltip).subscribe((gTooltip) => {
            this.translate.get(helptext.memory_tooltip).subscribe((mem_tooltip) => {
              this.translate.get(helptext.memory_unit).subscribe((mem_unit) => {
                global_label = gLabel;
                global_tooltip = gTooltip;
                _.find(this.wizardConfig[1].fieldConfig, { name: 'memory' }).placeholder = `${mem} ${global_label}`;
                _.find(this.wizardConfig[1].fieldConfig, { name: 'memory' }).tooltip = `${mem_tooltip} ${global_tooltip} ${mem_unit}`;
              });
            });
          });
        });
      });
      this.translate.get(helptext.volsize_placeholder).subscribe((placeholder) => {
        this.translate.get(helptext.volsize_tooltip).subscribe((tooltip) => {
          this.translate.get(helptext.volsize_tooltip_B).subscribe((tooltipB) => {
            _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' }).placeholder = `${placeholder} ${global_label}`;
            _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' }).tooltip = `${tooltip} ${global_label} ${tooltipB}`;
          });
        });
      });
    }, 2000);
  }
  getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  memoryValidator(name: string) {
    const self = this;
    return function validMem(control: FormControl) {
      const config = self.wizardConfig[1].fieldConfig.find((c) => c.name === name);

      const errors = self.storageService.convertHumanStringToNum(control.value) < 268435456
        ? { validMem: true }
        : null;

      if (errors) {
        config.hasErrors = true;
        config.warnings = helptext.memory_size_err;
      } else {
        config.hasErrors = false;
        config.warnings = '';
      }

      return errors;
    };
  }

  cpuValidator(name: string) {
    const self = this;
    return function validCPU(control: FormControl) {
      const config = self.wizardConfig[1].fieldConfig.find((c) => c.name === name);
      setTimeout(() => {
        const errors = self.vcpus * self.cores * self.threads > 16
          ? { validCPU: true }
          : null;

        if (errors) {
          config.hasErrors = true;
          config.warnings = T('The product of vCPUs, cores and threads must not exceed 16.');
        } else {
          config.hasErrors = false;
          config.warnings = '';
        }
        return errors;
      }, 100);
    };
  }

  volSizeValidator(name: string) {
    const self = this;
    return function validStorage(control: FormControl) {
      const config = self.wizardConfig[2].fieldConfig.find((c) => c.name === name);

      if (control.value && self.statSize) {
        const requestedSize = self.storageService.convertHumanStringToNum(control.value);
        const errors = self.statSize.free_bytes < requestedSize
          ? { validStorage: true }
          : null;

        if (errors) {
          config.hasErrors = true;
          self.translate.get('Cannot allocate').subscribe((msg) => {
            self.translate.get('to storage for this virtual machine.').subscribe((msg2) => {
              config.warnings = `${msg} ${self.storageService.humanReadable} ${msg2}`;
            });
          });
        } else {
          config.hasErrors = false;
          config.warnings = '';
        }

        return errors;
      }
    };
  }

  blurEvent2(parent) {
    const enteredVal = parent.entityWizard.formGroup.value.formArray[1].memory;
    const vm_memory_requested = parent.storageService.convertHumanStringToNum(enteredVal);
    if (isNaN(vm_memory_requested)) {
      console.error(vm_memory_requested); // leaves form in previous error state
    } else if (enteredVal.replace(/\s/g, '').match(/[^0-9]/g) === null) {
      parent.entityWizard.formArray.get([1]).get('memory')
        .setValue(parent.storageService.convertBytestoHumanReadable(enteredVal.replace(/\s/g, ''), 0));
    } else {
      parent.entityWizard.formArray.get([1]).get('memory').setValue(parent.storageService.humanReadable);
      _.find(parent.wizardConfig[1].fieldConfig, { name: 'memory' })['hasErrors'] = false;
      _.find(parent.wizardConfig[1].fieldConfig, { name: 'memory' })['errors'] = '';
    }
  }

  blurEvent3(parent) {
    const enteredVal = parent.entityWizard.formArray.controls[2].value.volsize;
    const volsize = parent.storageService.convertHumanStringToNum(enteredVal, false, 'mgtp');
    if (volsize >= 1048576) {
      parent.entityWizard.formArray.get([2]).get('volsize').setValue(parent.storageService.humanReadable);
      _.find(parent.wizardConfig[2].fieldConfig, { name: 'volsize' })['hasErrors'] = false;
      _.find(parent.wizardConfig[2].fieldConfig, { name: 'volsize' })['errors'] = '';
    } else if (isNaN(volsize)) {
      console.error(volsize); // leaves form in previous error state
    } else {
      parent.entityWizard.formArray.get([2]).get('volsize').setValue('1 MiB');
    }
  }

  async customSubmit(value) {
    this.prefService.savePreferences();
    let hdd;
    const vm_payload = {};
    const zvol_payload = {};

    if (value.datastore) {
      value.datastore = value.datastore.replace('/mnt/', '');
      hdd = `${value.datastore}/${value.name.replace(/\s+/g, '-')}-${Math.random().toString(36).substring(7)}`;
    }

    // zvol_payload only applies if the user is creating one
    zvol_payload['create_zvol'] = true;
    zvol_payload['zvol_name'] = hdd;
    zvol_payload['zvol_volsize'] = this.storageService.convertHumanStringToNum(value.volsize);

    vm_payload['memory'] = value.memory;
    vm_payload['name'] = value.name;
    vm_payload['description'] = value.description;
    vm_payload['time'] = value.time;
    vm_payload['vcpus'] = value.vcpus;
    vm_payload['cores'] = value.cores;
    vm_payload['threads'] = value.threads;
    vm_payload['memory'] = Math.ceil(this.storageService.convertHumanStringToNum(value.memory) / 1024 ** 2); // bytes -> mb
    vm_payload['bootloader'] = value.bootloader;
    vm_payload['shutdown_timeout'] = value.shutdown_timeout;
    vm_payload['autoloader'] = value.autoloader;
    vm_payload['autostart'] = value.autostart;
    if (value.iso_path && value.iso_path !== undefined) {
      vm_payload['devices'] = [
        { dtype: 'NIC', attributes: { type: value.NIC_type, mac: value.NIC_mac, nic_attach: value.nic_attach } },
        {
          dtype: 'DISK',
          attributes: {
            path: hdd, type: value.hdd_type, physical_sectorsize: null, logical_sectorsize: null,
          },
        },
        { dtype: 'CDROM', attributes: { path: value.iso_path } },
      ];
    } else {
      vm_payload['devices'] = [
        { dtype: 'NIC', attributes: { type: value.NIC_type, mac: value.NIC_mac, nic_attach: value.nic_attach } },
        {
          dtype: 'DISK',
          attributes: {
            path: hdd, type: value.hdd_type, physical_sectorsize: null, logical_sectorsize: null,
          },
        },
      ];
    }

    if (value.enable_vnc && value.bootloader !== 'UEFI_CSM') {
      vm_payload['devices'].push({
        dtype: 'VNC',
        attributes: {
          wait: value.wait,
          vnc_port: String(this.getRndInteger(5900, 65535)),
          vnc_resolution: '1024x768',
          vnc_bind: value.vnc_bind,
          vnc_password: '',
          vnc_web: true,
        },
      });
    }
    this.loader.open();
    if (value.hdd_path) {
      for (const device of vm_payload['devices']) {
        if (device.dtype === 'DISK') {
          device.attributes.path = `/dev/zvol/${value.hdd_path}`;
        }
      }
      this.ws.call('vm.create', [vm_payload]).subscribe((vm_res) => {
        this.loader.close();
        this.router.navigate(['/vm']);
      }, (error) => {
        this.loader.close();
        this.dialogService.errorReport(T('Error creating VM.'), error.reason, error.trace.formatted);
      });
    } else {
      for (const device of vm_payload['devices']) {
        if (device.dtype === 'DISK') {
          const orig_hdd = device.attributes.path;
          const create_zvol = zvol_payload['create_zvol'];
          const zvol_name = zvol_payload['zvol_name'];
          const zvol_volsize = zvol_payload['zvol_volsize'];

          device.attributes.path = `/dev/zvol/${orig_hdd}`;
          device.attributes.type = value.hdd_type;
          device.attributes.create_zvol = create_zvol;
          device.attributes.zvol_name = zvol_name;
          device.attributes.zvol_volsize = zvol_volsize;
        }
      }
      this.ws.call('vm.create', [vm_payload]).subscribe((vm_res) => {
        this.loader.close();
        this.router.navigate(['/vm']);
      }, (error) => {
        this.loader.close();
        this.dialogService.errorReport(T('Error creating VM.'), error.reason, error.trace.formatted);
      });
    }
  }
}
