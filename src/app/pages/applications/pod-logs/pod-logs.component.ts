import { HttpClient } from '@angular/common/http';
import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subject, Subscription } from 'rxjs';
import { CoreService } from 'app/core/services/core-service/core.service';
import helptext from 'app/helptext/apps/apps';
import { CoreEvent } from 'app/interfaces/events';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, ShellService, WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { StorageService } from 'app/services/storage.service';
import { ApplicationsService } from '../applications.service';

interface PodLogEvent {
  data: string;
  timestamp: string;
}

@UntilDestroy()
@Component({
  selector: 'app-pod-logs',
  templateUrl: './pod-logs.component.html',
  styleUrls: ['./pod-logs.component.scss'],
  providers: [ShellService],
  encapsulation: ViewEncapsulation.None,
})

export class PodLogsComponent implements OnInit, OnDestroy {
  @ViewChild('logContainer', { static: true }) logContainer: ElementRef;
  font_size = 14;
  formEvent$: Subject<CoreEvent>;
  chart_release_name: string;
  pod_name: string;
  container_name: string;
  protected tail_lines = 500;
  protected podDetails: Record<string, string[]>;
  protected tempPodDetails: Record<string, string[]>;
  protected apps: string[] = [];
  protected route_success: string[] = ['apps'];

  choosePod: DialogFormConfiguration;
  private podLogsChangedListener: Subscription;
  podLogs: PodLogEvent[];

  constructor(protected core: CoreService,
    private ws: WebSocketService,
    private appService: ApplicationsService,
    private dialogService: DialogService,
    public translate: TranslateService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected storageService: StorageService,
    protected http: HttpClient,
    protected router: Router,
    private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.chart_release_name = params['rname'];
      this.pod_name = params['pname'];
      this.container_name = params['cname'];
      this.tail_lines = params['tail_lines'];

      // Get app list
      this.appService.getChartReleaseNames().pipe(untilDestroyed(this)).subscribe((charts) => {
        charts.forEach((chart) => {
          this.apps.push(chart.name);
        });
      });

      // Get pod list for the selected app
      this.ws.call('chart.release.pod_logs_choices', [this.chart_release_name]).pipe(untilDestroyed(this)).subscribe((res) => {
        this.podDetails = res;

        const podDetail = res[this.pod_name];
        if (!podDetail) {
          this.dialogService.confirm(helptext.podLogs.nopod.title, helptext.podLogs.nopod.message, true, 'Close', false, null, null, null, null, true);
        }
      });

      this.setupToolbarButtons();
      this.reconnect();
    });
  }

  ngOnDestroy(): void {
    if (this.podLogsChangedListener) {
      this.podLogsChangedListener.unsubscribe();
    }
  }

  // subscribe pod log for selected app, pod and container.
  reconnect(): void {
    this.podLogs = [];
    if (this.podLogsChangedListener) {
      this.podLogsChangedListener.unsubscribe();
    }

    const subName = `kubernetes.pod_log_follow:{"release_name":"${this.chart_release_name}", "pod_name":"${this.pod_name}", "container_name":"${this.container_name}", "tail_lines": ${this.tail_lines}}`;

    this.podLogsChangedListener = this.ws.sub(subName).pipe(untilDestroyed(this)).subscribe((res: PodLogEvent) => {
      if (res) {
        this.podLogs.push(res);
        this.scrollToBottom();
      }
    });
  }

  // scroll to bottom, show last log.
  scrollToBottom(): void {
    try {
      this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
    } catch (err) {

    }
  }

  setupToolbarButtons(): void {
    this.formEvent$ = new Subject();
    this.formEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == 'download') {
        this.showChooseLogsDialog(true);
      } else if (evt.data.event_control == 'reconnect') {
        this.showChooseLogsDialog(false);
      } else if (evt.data.event_control == 'fontsize') {
        this.font_size = evt.data.fontsize;
      }
    });

    let controls = [];
    controls = [
      {
        name: 'fontsize',
        label: 'Set font size',
        type: 'slider',
        min: 10,
        max: 20,
        step: 1,
        value: this.font_size,
      },
      {
        name: 'reconnect',
        label: 'Reconnect',
        type: 'button',
        color: 'secondary',
      },
      {
        name: 'download',
        label: 'Download Logs',
        type: 'button',
        color: 'primary',
      },
    ];
    // Setup Global Actions
    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.formEvent$,
        controls,
      },
    };

    this.core.emit({ name: 'GlobalActions', data: actionsConfig, sender: this });
  }

  updateChooseLogsDialog(isDownload = false): void {
    let containerOptions: Option[] = [];

    if (this.pod_name && this.podDetails[this.pod_name]) {
      containerOptions = this.podDetails[this.pod_name].map((item) => ({
        label: item,
        value: item,
      }));
    }

    this.choosePod = {
      title: helptext.podLogs.title,
      fieldConfig: [{
        type: 'select',
        name: 'apps',
        placeholder: helptext.podLogs.chooseApp.placeholder,
        required: true,
        value: this.chart_release_name,
        options: this.apps.map((item) => ({
          label: item,
          value: item,
        })),
      }, {
        type: 'select',
        name: 'pods',
        placeholder: helptext.podLogs.choosePod.placeholder,
        required: true,
        value: this.pod_name,
        options: Object.keys(this.podDetails).map((item) => ({
          label: item,
          value: item,
        })),
      }, {
        type: 'select',
        name: 'containers',
        placeholder: helptext.podLogs.chooseConatiner.placeholder,
        required: true,
        value: this.container_name,
        options: containerOptions,
      }, {
        type: 'input',
        name: 'tail_lines',
        placeholder: helptext.podLogs.tailLines.placeholder,
        value: this.tail_lines,
        required: true,
      }],
      saveButtonText: isDownload ? helptext.podLogs.downloadBtn : helptext.podLogs.chooseBtn,
      customSubmit: isDownload ? this.download : this.onChooseLogs,
      afterInit: this.afterLogsDialogInit,
      parent: this,
    };
  }

  showChooseLogsDialog(isDownload = false): void {
    this.tempPodDetails = this.podDetails;
    this.updateChooseLogsDialog(isDownload);
    this.dialogService.dialogForm(this.choosePod, true);
  }

  // download log
  download(entityDialog: EntityDialogComponent<this>): void {
    const self = entityDialog.parent;
    const chart_release_name = entityDialog.formGroup.controls['apps'].value;
    const pod_name = entityDialog.formGroup.controls['pods'].value;
    const container_name = entityDialog.formGroup.controls['containers'].value;
    const tail_lines = entityDialog.formGroup.controls['tail_lines'].value;

    self.dialogService.closeAllDialogs();

    self.loader.open();
    const fileName = `${chart_release_name}_${pod_name}_${container_name}.log`;
    const mimetype = 'application/octet-stream';
    self.ws.call(
      'core.download',
      [
        'chart.release.pod_logs',
        [chart_release_name, { pod_name, container_name, tail_lines }],
        fileName,
      ],
    ).pipe(untilDestroyed(this)).subscribe((res: any) => {
      self.loader.close();
      const url = res[1];
      self.storageService.streamDownloadFile(self.http, url, fileName, mimetype)
        .pipe(untilDestroyed(this))
        .subscribe((file: Blob) => {
          if (res !== null && res !== '') {
            self.storageService.downloadBlob(file, fileName);
          }
        });
    }, (e: any) => {
      self.loader.close();
      new EntityUtils().handleWSError(self, e, self.dialogService);
    });
  }

  onChooseLogs(entityDialog: EntityDialogComponent<this>): void {
    const self = entityDialog.parent;
    self.chart_release_name = entityDialog.formGroup.controls['apps'].value;
    self.pod_name = entityDialog.formGroup.controls['pods'].value;
    self.container_name = entityDialog.formGroup.controls['containers'].value;
    self.tail_lines = entityDialog.formGroup.controls['tail_lines'].value;
    self.podDetails = self.tempPodDetails;

    self.reconnect();
    self.dialogService.closeAllDialogs();
  }

  afterLogsDialogInit(entityDialog: EntityDialogComponent): void {
    const self = entityDialog.parent as PodLogsComponent;

    const podFC = _.find(entityDialog.fieldConfig, { name: 'pods' });
    const containerFC = _.find(entityDialog.fieldConfig, { name: 'containers' });

    // when app selection changed
    entityDialog.formGroup.controls['apps'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      podFC.options = [];
      containerFC.options = [];

      self.loader.open();
      self.ws.call('chart.release.pod_logs_choices', [value]).pipe(untilDestroyed(this)).subscribe((res) => {
        self.loader.close();
        self.tempPodDetails = res;
        let pod_name;
        if (Object.keys(self.tempPodDetails).length > 0) {
          pod_name = Object.keys(self.tempPodDetails)[0];
        } else {
          pod_name = null;
        }

        podFC.options = Object.keys(self.tempPodDetails).map((item) => ({
          label: item,
          value: item,
        }));
        entityDialog.formGroup.controls['pods'].setValue(pod_name);
      });
    });

    // when pod selection changed
    entityDialog.formGroup.controls['pods'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value) {
        const containers = self.tempPodDetails[value];

        containerFC.options = containers.map((item) => ({
          label: item,
          value: item,
        }));
        if (containers && containers.length > 0) {
          entityDialog.formGroup.controls['containers'].setValue(containers[0]);
        } else {
          entityDialog.formGroup.controls['containers'].setValue(null);
        }
      }
    });
  }
}
