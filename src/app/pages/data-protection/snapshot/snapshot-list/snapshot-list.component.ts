import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import { PeriodicSnapshotTask, PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { SnapshotFormComponent } from 'app/pages/data-protection/snapshot/snapshot-form/snapshot-form.component';
import { DialogService, StorageService, WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { TaskService } from 'app/services/task.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-snapshot-task-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [TaskService, StorageService],
})
export class SnapshotListComponent implements EntityTableConfig<PeriodicSnapshotTaskUi> {
  title = T('Periodic Snapshot Tasks');
  queryCall: 'pool.snapshottask.query' = 'pool.snapshottask.query';
  updateCall: 'pool.snapshottask.update' = 'pool.snapshottask.update';
  wsDelete: 'pool.snapshottask.delete' = 'pool.snapshottask.delete';
  route_add: string[] = ['tasks', 'snapshot', 'add'];
  route_add_tooltip = 'Add Periodic Snapshot Task';
  route_edit: string[] = ['tasks', 'snapshot', 'edit'];
  entityList: EntityTableComponent;
  asyncView = true;

  columns = [
    { name: T('Pool/Dataset'), prop: 'dataset', always_display: true },
    { name: T('Recursive'), prop: 'recursive' },
    { name: T('Naming Schema'), prop: 'naming_schema' },
    { name: T('When'), prop: 'when' },
    { name: T('Frequency'), prop: 'frequency', enableMatTooltip: true },
    { name: T('Next Run'), prop: 'next_run', hidden: true },
    { name: T('Keep snapshot for'), prop: 'keepfor', hidden: true },
    { name: T('Legacy'), prop: 'legacy', hidden: true },
    { name: T('VMware Sync'), prop: 'vmware_sync', hidden: true },
    { name: T('Enabled'), prop: 'enabled', selectable: true },
    {
      name: T('State'), prop: 'state', state: 'state', button: true,
    },
  ];
  rowIdentifier = 'id';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Periodic Snapshot Task'),
      key_props: ['dataset', 'naming_schema', 'keepfor'],
    },
  };

  constructor(
    private dialogService: DialogService,
    private ws: WebSocketService,
    private taskService: TaskService,
    private modalService: ModalService,
    private storageService: StorageService,
    private dialog: DialogService,
    private translate: TranslateService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(data: PeriodicSnapshotTask[]): PeriodicSnapshotTaskUi[] {
    return data.map((task) => {
      const transformedTask = {
        ...task,
        keepfor: `${task.lifetime_value} ${task.lifetime_unit}(S)`,
        when: this.translate.instant(T('From {task_begin} to {task_end}'), { task_begin: task.schedule.begin, task_end: task.schedule.end }),
        cron_schedule: `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`,
      } as PeriodicSnapshotTaskUi;

      return {
        ...transformedTask,
        next_run: this.taskService.getTaskNextRun(transformedTask.cron_schedule),
        frequency: this.taskService.getTaskCronDescription(transformedTask.cron_schedule),
      };
    });
  }

  onButtonClick(row: PeriodicSnapshotTaskUi): void {
    this.stateButton(row);
  }

  stateButton(row: PeriodicSnapshotTaskUi): void {
    if (row.state.state === JobState.Error) {
      this.dialogService.errorReport(row.state.state, row.state.error);
    }
  }

  onCheckboxChange(row: PeriodicSnapshotTaskUi): void {
    row.enabled = !row.enabled;
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled }]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (!res) {
          row.enabled = !row.enabled;
        }
      },
      (err) => {
        row.enabled = !row.enabled;
        new EntityUtils().handleWSError(this, err, this.dialogService);
      },
    );
  }

  doAdd(id?: number): void {
    this.modalService.open(
      'slide-in-form',
      new SnapshotFormComponent(this.taskService, this.storageService, this.dialog, this.modalService),
      id,
    );
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }
}
