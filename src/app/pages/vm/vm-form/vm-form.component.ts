import { ApplicationRef, Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { ProductType } from 'app/enums/product-type.enum';
import { VmDeviceType, VmTime } from 'app/enums/vm.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { GpuDevice } from 'app/interfaces/gpu-device.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import {
  FieldConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  WebSocketService, StorageService, VmService, AppLoaderService, DialogService, SystemGeneralService,
} from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-vm',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [StorageService],

})
export class VmFormComponent implements FormConfiguration {
  queryCall: 'vm.query' = 'vm.query';
  editCall: 'vm.update' = 'vm.update';
  isEntity = true;
  route_success: string[] = ['vm'];
  protected entityForm: EntityFormComponent;
  save_button_enabled: boolean;
  private rawVmData: any;
  vcpus: number;
  cores: number;
  threads: number;
  private gpus: GpuDevice[];
  private isolatedGpuPciIds: string[];
  private maxVCPUs: number;
  private productType = window.localStorage.getItem('product_type') as ProductType;
  queryCallOption: any[] = [];

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.vm_settings_title,
      class: 'vm_settings',
      label: true,
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.name_placeholder,
          tooltip: helptext.name_tooltip,
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.description_placeholder,
          tooltip: helptext.description_tooltip,
        },
        {
          name: 'time',
          placeholder: helptext.time_placeholder,
          tooltip: helptext.time_tooltip,
          type: 'select',
          options: [
            { label: helptext.time_local_text, value: VmTime.Local },
            { label: helptext.time_utc_text, value: VmTime.Utc },
          ],
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
          placeholder: helptext.shutdown_timeout.placeholder,
          tooltip: helptext.shutdown_timeout.tooltip,
          validation: helptext.shutdown_timeout.validation,
        },
        {
          type: 'checkbox',
          name: 'autostart',
          placeholder: helptext.autostart_placeholder,
          tooltip: helptext.autostart_tooltip,
        },
      ],
    },
    {
      name: 'spacer',
      class: 'spacer',
      label: false,
      width: '2%',
      config: [],
    },
    {
      name: helptext.vm_cpu_mem_title,
      class: 'vm_settings',
      label: true,
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'vcpus',
          inputType: 'number',
          placeholder: helptext.vcpus_placeholder,
          tooltip: helptext.vcpus_tooltip,
          validation: [Validators.required, Validators.min(1), this.cpuValidator('threads')],
        },
        {
          type: 'input',
          name: 'cores',
          inputType: 'number',
          placeholder: helptext.cores.placeholder,
          tooltip: helptext.cores.tooltip,
          validation: [Validators.required, Validators.min(1), this.cpuValidator('threads')],
        },
        {
          type: 'input',
          name: 'threads',
          inputType: 'number',
          placeholder: helptext.threads.placeholder,
          tooltip: helptext.threads.tooltip,
          validation: [Validators.required, Validators.min(1), this.cpuValidator('threads')],
        },
        {
          type: 'select',
          name: 'cpu_mode',
          placeholder: helptext.cpu_mode.placeholder,
          tooltip: helptext.cpu_mode.tooltip,
          options: helptext.cpu_mode.options,
          isHidden: true,
        },
        {
          type: 'select',
          name: 'cpu_model',
          placeholder: helptext.cpu_model.placeholder,
          tooltip: helptext.cpu_model.tooltip,
          options: [
            { label: '---', value: '' },
          ],
          isHidden: true,
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: `${helptext.memory_placeholder} ${globalHelptext.human_readable.suggestion_label}`,
          tooltip: helptext.memory_tooltip,
          blurStatus: true,
          blurEvent: this.blurEvent,
          parent: this,
        },

      ],
    },
    {
      name: 'spacer',
      class: 'spacer',
      label: false,
      width: '2%',
      config: [],
    },
    {
      name: T('GPU'),
      class: 'vm_settings',
      label: true,
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'hide_from_msr',
          placeholder: T('Hide from MSR'),
          value: false,
        },
        {
          type: 'select',
          placeholder: T("GPU's"),
          name: 'gpus',
          multiple: true,
          options: [],
          required: true,
        },
      ],
    },
  ];
  private bootloader: FieldConfig;

  constructor(
    protected router: Router,
    private loader: AppLoaderService,
    protected ws: WebSocketService,
    protected storageService: StorageService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected vmService: VmService,
    protected route: ActivatedRoute,
    private translate: TranslateService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
  ) {}

  preInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['pk']) {
        const opt = params.pk ? ['id', '=', parseInt(params.pk, 10)] : [];
        this.queryCallOption = [opt];
      }
    });
    this.ws.call('vm.maximum_supported_vcpus').pipe(untilDestroyed(this)).subscribe((max) => {
      this.maxVCPUs = max;
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.bootloader = _.find(this.fieldConfig, { name: 'bootloader' });
    this.vmService.getBootloaderOptions().pipe(untilDestroyed(this)).subscribe((options) => {
      for (const option in options) {
        this.bootloader.options.push({ label: options[option], value: option });
      }
    });

    entityForm.formGroup.controls['memory'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: any) => {
      const mem = _.find(this.fieldConfig, { name: 'memory' });
      if (typeof (value) === 'number') {
        value = value.toString();
      }
      const filteredValue = this.storageService.convertHumanStringToNum(value);
      mem['hasErrors'] = false;
      mem['errors'] = '';
      if (isNaN(filteredValue)) {
        mem['hasErrors'] = true;
        mem['errors'] = globalHelptext.human_readable.input_error;
      }
    });

    entityForm.formGroup.controls['vcpus'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: number) => {
      this.vcpus = value;
    });
    entityForm.formGroup.controls['cores'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: number) => {
      this.cores = value;
    });
    entityForm.formGroup.controls['threads'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: number) => {
      this.threads = value;
    });

    if (this.productType.includes(ProductType.Scale)) {
      _.find(this.fieldConfig, { name: 'cpu_mode' })['isHidden'] = false;
      const cpuModel = _.find(this.fieldConfig, { name: 'cpu_model' });
      cpuModel.isHidden = false;

      this.vmService.getCPUModels().pipe(untilDestroyed(this)).subscribe((models) => {
        for (const model in models) {
          cpuModel.options.push(
            {
              label: model, value: models[model],
            },
          );
        }
      });
    }

    this.systemGeneralService.getAdvancedConfig$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.isolatedGpuPciIds = res.isolated_gpu_pci_ids;
    });

    const gpusFormControl = this.entityForm.formGroup.controls['gpus'];
    gpusFormControl.valueChanges.pipe(untilDestroyed(this)).subscribe((gpusValue: string[]) => {
      const finalIsolatedPciIds = [...this.isolatedGpuPciIds];
      for (const gpuValue of gpusValue) {
        if (finalIsolatedPciIds.findIndex((pciId) => pciId === gpuValue) === -1) {
          finalIsolatedPciIds.push(gpuValue);
        }
      }
      const gpusConf = _.find(this.entityForm.fieldConfig, { name: 'gpus' });
      if (finalIsolatedPciIds.length >= gpusConf.options.length) {
        const prevSelectedGpus = [];
        for (const gpu of this.gpus) {
          if (this.isolatedGpuPciIds.findIndex((igpi) => igpi === gpu.addr.pci_slot) >= 0) {
            prevSelectedGpus.push(gpu);
          }
        }
        const listItems = '<li>' + prevSelectedGpus.map((gpu, index) => (index + 1) + '. ' + gpu.description).join('</li><li>') + '</li>';
        gpusConf.warnings = 'At least 1 GPU is required by the host for it’s functions.<p>Currently following GPU(s) have been isolated:<ol>' + listItems + '</ol></p><p>With your selection, no GPU is available for the host to consume.</p>';
        gpusFormControl.setErrors({ maxPCIIds: true });
      } else {
        gpusConf.warnings = null;
        gpusFormControl.setErrors(null);
      }
    });
  }

  blurEvent(parent: any): void {
    if (parent.entityForm) {
      parent.entityForm.formGroup.controls['memory'].setValue(parent.storageService.humanReadable);
      const valString = (parent.entityForm.formGroup.controls['memory'].value);
      const valBytes = Math.round(parent.storageService.convertHumanStringToNum(valString) / 1048576);
      if (valBytes < 256) {
        const mem = _.find(parent.fieldConfig, { name: 'memory' });
        mem['hasErrors'] = true;
        mem['errors'] = helptext.memory_size_err;
      }
    }
  }

  cpuValidator(name: string): any {
    const self = this;
    return function validCPU() {
      const config = self.fieldConfig.find((c) => c.name === name);
      setTimeout(() => {
        const errors = self.vcpus * self.cores * self.threads > self.maxVCPUs
          ? { validCPU: true }
          : null;

        if (errors) {
          config.hasErrors = true;
          config.hasErrors = true;
          self.translate.get(helptext.vcpus_warning).pipe(untilDestroyed(this)).subscribe((warning) => {
            config.warnings = warning + ` ${self.maxVCPUs}.`;
          });
        } else {
          config.hasErrors = false;
          config.warnings = '';
        }
        return errors;
      }, 100);
    };
  }

  resourceTransformIncomingRestData(vmRes: any): any {
    this.rawVmData = vmRes;
    vmRes['memory'] = this.storageService.convertBytestoHumanReadable(vmRes['memory'] * 1048576, 0);
    this.ws.call('device.get_info', ['GPU']).pipe(untilDestroyed(this)).subscribe((gpus: GpuDevice[]) => {
      this.gpus = gpus;
      const vmPciSlots: string[] = vmRes.devices
        .filter((device: any) => device.dtype === VmDeviceType.Pci)
        .map((pciDevice: any) => pciDevice.attributes.pptdev);
      const gpusConf = _.find(this.entityForm.fieldConfig, { name: 'gpus' });
      for (const item of gpus) {
        gpusConf.options.push({ label: item.description, value: item.addr.pci_slot });
      }
      const vmGpus = this.gpus.filter((gpu) => {
        for (const gpuPciDevice of gpu.devices) {
          if (!vmPciSlots.includes(gpuPciDevice.vm_pci_slot)) {
            return false;
          }
        }
        return true;
      });
      const gpuVmPciSlots = vmGpus.map((gpu) => gpu.addr.pci_slot);
      this.entityForm.formGroup.controls['gpus'].setValue(gpuVmPciSlots);
    });
    return vmRes;
  }

  beforeSubmit(data: any): void {
    if (data['memory'] !== undefined && data['memory'] !== null) {
      data['memory'] = Math.round(this.storageService.convertHumanStringToNum(data['memory']) / 1048576);
    }
    return data;
  }

  customSubmit(updatedVmData: any): void {
    const pciDevicesToCreate = [];
    const vmPciDeviceIdsToRemove = [];

    const prevVmPciDevices = this.rawVmData.devices.filter((device: any) => device.dtype === VmDeviceType.Pci);
    const prevVmPciSlots: string[] = prevVmPciDevices.map((pciDevice: any) => pciDevice.attributes.pptdev);
    const prevGpus = this.gpus.filter((gpu) => {
      for (const gpuPciDevice of gpu.devices) {
        if (!prevVmPciSlots.includes(gpuPciDevice.vm_pci_slot)) {
          return false;
        }
      }
      return true;
    });
    const currentGpusSelected = this.gpus.filter((gpu) => updatedVmData['gpus'].includes(gpu.addr.pci_slot));

    for (const currentGpu of currentGpusSelected) {
      let found = false;
      for (const prevGpu of prevGpus) {
        if (prevGpu.addr.pci_slot === currentGpu.addr.pci_slot) {
          found = true;
        }
      }
      if (!found) {
        const gpuPciDevices = currentGpu.devices.filter((gpuPciDevice) => {
          return !prevVmPciSlots.includes(gpuPciDevice.vm_pci_slot);
        });
        const gpuPciDevicesConverted = gpuPciDevices.map((pptDev) => ({
          dtype: VmDeviceType.Pci,
          vm: this.rawVmData.id,
          attributes: {
            pptdev: pptDev.vm_pci_slot,
          },
        }));
        pciDevicesToCreate.push(...gpuPciDevicesConverted);
      }
    }

    for (const prevGpu of prevGpus) {
      let found = false;
      for (const currentGpu of currentGpusSelected) {
        if (currentGpu.addr.pci_slot === prevGpu.addr.pci_slot) {
          found = true;
        }
      }
      if (!found) {
        const prevVmGpuPciDevicesPciSlots = prevGpu.devices.map((prevGpuPciDevice) => prevGpuPciDevice.vm_pci_slot);
        const vmPciDevices = prevVmPciDevices.filter((prevVmPciDevice: any) => {
          return prevVmGpuPciDevicesPciSlots.includes(prevVmPciDevice.attributes.pptdev);
        });
        const vmPciDeviceIds = vmPciDevices.map((prevVmPciDevice: any) => prevVmPciDevice.id);
        vmPciDeviceIdsToRemove.push(...vmPciDeviceIds);
      }
    }

    const observables: Observable<any>[] = [];
    if (updatedVmData.gpus) {
      const finalIsolatedPciIds = [...this.isolatedGpuPciIds];
      for (const gpuValue of updatedVmData.gpus) {
        if (finalIsolatedPciIds.findIndex((pciId) => pciId === gpuValue) === -1) {
          finalIsolatedPciIds.push(gpuValue);
        }
      }
      observables.push(this.ws.call('system.advanced.update', [{ isolated_gpu_pci_ids: finalIsolatedPciIds }]));
    }

    for (const deviceId of vmPciDeviceIdsToRemove) {
      observables.push(this.ws.call('datastore.delete', ['vm.device', deviceId]));
    }

    for (const device of pciDevicesToCreate) {
      observables.push(this.ws.call('vm.device.create', [device]));
    }

    delete updatedVmData['gpus'];
    this.loader.open();
    observables.push(this.ws.call('vm.update', [this.rawVmData.id, updatedVmData]));

    combineLatest(observables).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (error) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, error, this.dialogService);
      },
    );
  }
}
