import { Component, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  chartsTrain, ixChartApp, latestVersion, officialCatalog,
} from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { Option } from 'app/interfaces/option.interface';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { Wizard } from 'app/pages/common/entity/entity-form/models/wizard.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityWizardComponent } from 'app/pages/common/entity/entity-wizard/entity-wizard.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, ModalService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-chart-release-add',
  template: '<entity-wizard [conf]="this"></entity-wizard>',

})
export class ChartReleaseAddComponent implements OnDestroy, WizardConfiguration {
  addCall: 'chart.release.create' = 'chart.release.create';

  private title = helptext.chartForm.title;
  private dialogRef: MatDialogRef<EntityJobComponent>;
  hideCancel = true;
  summary: any = {};
  summaryTitle = 'Chart Release Summary';
  private entityWizard: EntityWizardComponent;
  private destroy$ = new Subject();
  private interfaceList: Option[] = [];
  private entityUtils = new EntityUtils();

  wizardConfig: Wizard[] = [
    {
      label: helptext.wizardLabels.image,
      fieldConfig: [
        {
          type: 'input',
          name: 'release_name',
          placeholder: helptext.chartForm.release_name.placeholder,
          tooltip: helptext.chartForm.release_name.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'repository',
          placeholder: helptext.chartForm.image.repo.placeholder,
          tooltip: helptext.chartForm.image.repo.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'tag',
          placeholder: helptext.chartForm.image.tag.placeholder,
          tooltip: helptext.chartForm.image.tag.tooltip,
          value: latestVersion,
        },
        {
          type: 'select',
          name: 'pullPolicy',
          placeholder: helptext.chartForm.image.pullPolicy.placeholder,
          tooltip: helptext.chartForm.image.pullPolicy.tooltip,
          options: helptext.chartForm.image.pullPolicy.options,
          value: helptext.chartForm.image.pullPolicy.options[0].value,
        },
        {
          type: 'select',
          name: 'updateStrategy',
          placeholder: helptext.chartForm.update.placeholder,
          tooltip: helptext.chartForm.update.tooltip,
          options: helptext.chartForm.update.options,
          value: helptext.chartForm.update.options[0].value,
        },
      ],
    },
    {
      label: helptext.wizardLabels.container,
      fieldConfig: [
        {
          type: 'chip',
          name: 'containerCommand',
          placeholder: helptext.chartForm.container.command.placeholder,
          tooltip: helptext.chartForm.container.command.tooltip,
        },
        {
          type: 'chip',
          name: 'containerArgs',
          placeholder: helptext.chartForm.container.args.placeholder,
          tooltip: helptext.chartForm.container.args.tooltip,
        },
        {
          type: 'list',
          name: 'containerEnvironmentVariables',
          width: '100%',
          box: true,
          templateListField: [
            {
              type: 'input',
              name: 'name',
              placeholder: helptext.chartForm.container.env_vars.key.placeholder,
              tooltip: helptext.chartForm.container.env_vars.key.tooltip,
            },
            {
              type: 'input',
              name: 'value',
              placeholder: helptext.chartForm.container.env_vars.value.placeholder,
              tooltip: helptext.chartForm.container.env_vars.value.tooltip,
            },
          ],
          listFields: [],
        },
      ],
    },
    {
      label: helptext.chartForm.networking,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'hostNetwork',
          placeholder: helptext.chartForm.hostNetwork.placeholder,
          tooltip: helptext.chartForm.hostNetwork.tooltip,
          value: false,
        },
        {
          type: 'list',
          name: 'externalInterfaces',
          label: 'Add External Interface',
          box: true,
          width: '100%',
          templateListField: [
            {
              type: 'select',
              name: 'hostInterface',
              placeholder: helptext.chartForm.externalInterfaces.host.placeholder,
              tooltip: helptext.chartForm.externalInterfaces.host.tooltip,
              options: this.interfaceList,
            },
            {
              type: 'select',
              name: 'ipam',
              placeholder: helptext.chartForm.externalInterfaces.ipam.placeholder,
              tooltip: helptext.chartForm.externalInterfaces.ipam.tooltip,
              options: helptext.chartForm.externalInterfaces.ipam.options,
            },
            {
              type: 'list',
              name: 'staticIPConfigurations',
              width: '100%',
              templateListField: [
                {
                  type: 'ipwithnetmask',
                  name: 'staticIP',
                  placeholder: helptext.chartForm.externalInterfaces.staticConfig.placeholder,
                },
              ],
              listFields: [],
              relation: [
                {
                  action: RelationAction.Show,
                  when: [{
                    name: 'ipam',
                    value: 'static',
                  }],
                },
              ],
            },
            {
              type: 'list',
              name: 'staticRoutes',
              width: '100%',
              templateListField: [
                {
                  type: 'ipwithnetmask',
                  name: 'destination',
                  placeholder: helptext.chartForm.externalInterfaces.staticRoutes.destination.placeholder,
                },
                {
                  type: 'input',
                  name: 'gateway',
                  placeholder: helptext.chartForm.externalInterfaces.staticRoutes.gateway.placeholder,
                },
              ],
              listFields: [],
              relation: [
                {
                  action: RelationAction.Show,
                  when: [{
                    name: 'ipam',
                    value: 'static',
                  }],
                },
              ],
            },

          ],
          listFields: [],
        },
        {
          type: 'select',
          name: 'dnsPolicy',
          placeholder: helptext.chartForm.DNSPolicy.placeholder,
          tooltip: helptext.chartForm.DNSPolicy.tooltip,
          options: helptext.chartForm.DNSPolicy.options,
          value: helptext.chartForm.DNSPolicy.options[0].value,
        },
        {
          type: 'paragraph',
          name: 'paragraph_dns_config',
          paraText: helptext.chartForm.DNSConfig.label,
        },
        {
          type: 'chip',
          name: 'nameservers',
          placeholder: helptext.chartForm.DNSConfig.nameservers.placeholder,
          tooltip: helptext.chartForm.DNSConfig.nameservers.tooltip,
          value: [],
        },
        {
          type: 'chip',
          name: 'searches',
          placeholder: helptext.chartForm.DNSConfig.searches.placeholder,
          tooltip: helptext.chartForm.DNSConfig.searches.tooltip,
          value: [],
        },
      ],
    },
    {
      label: helptext.chartForm.portForwardingList.title,
      fieldConfig: [
        {
          type: 'list',
          name: 'portForwardingList',
          box: true,
          width: '100%',
          templateListField: [
            {
              type: 'input',
              name: 'containerPort',
              placeholder: helptext.chartForm.portForwardingList.containerPort.placeholder,
              validation: helptext.chartForm.portForwardingList.containerPort.validation,
            },
            {
              type: 'input',
              name: 'nodePort',
              placeholder: helptext.chartForm.portForwardingList.nodePort.placeholder,
              validation: helptext.chartForm.portForwardingList.nodePort.validation,
            },
            {
              type: 'select',
              name: 'protocol',
              placeholder: helptext.chartForm.portForwardingList.protocol.placeholder,
              options: helptext.chartForm.portForwardingList.protocol.options,
              value: helptext.chartForm.portForwardingList.protocol.options[0].value,
            },
          ],
          listFields: [],
        },
      ],
    },
    {
      label: helptext.chartForm.hostPathVolumes.title,
      fieldConfig: [
        {
          type: 'list',
          name: 'hostPathVolumes',
          width: '100%',
          box: true,
          templateListField: [
            {
              type: 'explorer',
              name: 'hostPath',
              initial: '/mnt',
              explorerType: 'directory',
              hideDirs: 'ix-applications',
              placeholder: helptext.chartForm.hostPathVolumes.hostPath.placeholder,
              tooltip: helptext.chartForm.hostPathVolumes.hostPath.tooltip,
            },
            {
              type: 'input',
              name: 'mountPath',
              placeholder: helptext.chartForm.hostPathVolumes.mountPath.placeholder,
              tooltip: helptext.chartForm.hostPathVolumes.mountPath.tooltip,
            },
            {
              type: 'checkbox',
              name: 'readOnly',
              placeholder: helptext.chartForm.hostPathVolumes.readOnly.placeholder,
              value: false,

            },
          ],
          listFields: [],
        },
      ],
    },
    {
      label: helptext.chartForm.volumes.title,
      fieldConfig: [
        {
          type: 'list',
          name: 'volumes',
          width: '100%',
          box: true,
          templateListField: [
            {
              name: 'datasetName',
              placeholder: helptext.chartForm.volumes.datasetName.placeholder,
              tooltip: helptext.chartForm.volumes.datasetName.tooltip,
              type: 'input',
            },
            {
              name: 'mountPath',
              placeholder: helptext.chartForm.volumes.mountPath.placeholder,
              tooltip: helptext.chartForm.volumes.mountPath.tooltip,
              type: 'input',
            },
          ],
          listFields: [],
        },
      ],
    },
    {
      label: helptext.chartForm.security.title,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'privileged',
          placeholder: helptext.chartForm.security.privileged.placeholder,
          value: false,
        },
      ],
    },
  ];

  private summaryItems = [
    { step: 0, fieldName: 'release_name', label: helptext.chartForm.release_name.placeholder },
    { step: 0, fieldName: 'repository', label: helptext.chartForm.image.repo.placeholder },
    { step: 0, fieldName: 'tag', label: helptext.chartForm.image.tag.placeholder },
    { step: 1, fieldName: 'containerCommand', label: helptext.chartForm.container.command.placeholder },
  ];

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService) {
    this.appService.getNICChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      for (const item in res) {
        this.interfaceList.push({ label: item, value: item });
      }
    });
  }

  afterInit(entityWizard: EntityWizardComponent): void {
    this.entityWizard = entityWizard;
    this.summaryItems.forEach((item) => {
      this.makeSummary(item.step, item.fieldName, item.label);
    });
  }

  setGpuConfiguration(catalogApp: any): void {
    if (!catalogApp) {
      return;
    }

    try {
      const gpuConfiguration = catalogApp.schema.questions.find((question: any) => question.variable == 'gpuConfiguration');

      if (gpuConfiguration && gpuConfiguration.schema.attrs.length > 0) {
        const fieldConfigs = this.entityUtils.parseSchemaFieldConfig(gpuConfiguration);
        const gpuWizardConfig = {
          label: gpuConfiguration.group,
          fieldConfig: fieldConfigs,
        };

        this.wizardConfig.push(gpuWizardConfig);
      }
    } catch (error) {
      console.error(error);
      this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  makeSummary(step: string | number, fieldName: string, label: string | number): void {
    (< FormGroup > this.entityWizard.formArray.get([step]).get(fieldName)).valueChanges
      .pipe(
        takeUntil(this.destroy$),
      )
      .pipe(untilDestroyed(this)).subscribe((res) => {
        this.summary[(label)] = res;
      });
  }

  customSubmit(data: any): void {
    let envVars = [];
    if (data.containerEnvironmentVariables?.length > 0 && data.containerEnvironmentVariables[0].name) {
      envVars = data.containerEnvironmentVariables;
    }

    let pfList = [];
    if (data.portForwardingList && data.portForwardingList.length > 0 && data.portForwardingList[0].containerPort) {
      pfList = data.portForwardingList;
    }

    let hpVolumes = [];
    if (data.hostPathVolumes && data.hostPathVolumes.length > 0 && data.hostPathVolumes[0].hostPath) {
      hpVolumes = data.hostPathVolumes;
    }

    let volList = [];
    if (data.volumes && data.volumes.length > 0 && data.volumes[0].datasetName) {
      volList = data.volumes;
    }

    const ext_interfaces: any[] = [];
    if (data.externalInterfaces && data.externalInterfaces.length > 0 && data.externalInterfaces[0].hostInterface) {
      data.externalInterfaces.forEach((i: any) => {
        if (i.ipam !== 'static') {
          ext_interfaces.push(
            {
              hostInterface: i.hostInterface,
              ipam: {
                type: i.ipam,
              },
            },
          );
        } else {
          const ipList: any[] = [];
          if (i.staticIPConfigurations && i.staticIPConfigurations.length > 0) {
            i.staticIPConfigurations.forEach((item: any) => {
              ipList.push(item.staticIP);
            });
          }
          ext_interfaces.push(
            {
              hostInterface: i.hostInterface,
              ipam: {
                type: i.ipam,
                staticIPConfigurations: ipList,
                staticRoutes: i.staticRoutes,
              },
            },
          );
        }
      });
    }

    const payload = [{
      catalog: officialCatalog,
      item: ixChartApp,
      release_name: data.release_name,
      train: chartsTrain,
      version: latestVersion,
      values: {
        containerArgs: data.containerArgs,
        containerCommand: data.containerCommand,
        containerEnvironmentVariables: envVars,
        dnsConfig: {
          nameservers: data.nameservers,
          searches: data.searches,
        },
        dnsPolicy: data.dnsPolicy,
        externalInterfaces: ext_interfaces,
        hostPathVolumes: hpVolumes,
        hostNetwork: data.hostNetwork,
        image: {
          repository: data.repository,
          pullPolicy: data.pullPolicy,
          tag: data.tag,
        },
        portForwardingList: pfList,
        updateStrategy: data.updateStrategy,
        volumes: volList,
        workloadType: 'Deployment',
        securityContext: {
          privileged: data.privileged,
        },
      },
    }];

    if (data['gpuConfiguration']) {
      (payload[0] as any).values['gpuConfiguration'] = data['gpuConfiguration'];
    }

    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: (
          helptext.installing),
      },
      disableClose: true,
    });
    this.dialogRef.componentInstance.setCall(this.addCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
