import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as filesize from 'filesize';
import { combineLatest, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { PoolStatus } from 'app/enums/pool-status.enum';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { Dataset, ExtraDatasetQueryOptions } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableService } from 'app/pages/common/entity/entity-table/entity-table.service';
import { VolumesListControlsComponent } from 'app/pages/storage/volumes/volume-list-controls/volumes-list-controls.component';
import { VolumesListTableConfig } from 'app/pages/storage/volumes/volumes-list/volumes-list-table-config';
import { ZfsPoolData } from 'app/pages/storage/volumes/volumes-list/zfs-pool-data.interface';
import { JobService, ValidationService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { T } from '../../../../translate-marker';
import { DatasetFormComponent } from '../datasets/dataset-form/dataset-form.component';
import { ZvolFormComponent } from '../zvol/zvol-form/zvol-form.component';

@UntilDestroy()
@Component({
  selector: 'app-volumes-list',
  styleUrls: ['./volumes-list.component.scss'],
  templateUrl: './volumes-list.component.html',
})
export class VolumesListComponent extends EntityTableComponent implements OnInit, OnDestroy {
  title = T('Pools');
  zfsPoolRows: ZfsPoolData[] = [];
  conf = new VolumesListTableConfig(
    this,
    this.router,
    '',
    [],
    this.mdDialog,
    this.ws,
    this.dialogService,
    this.loader,
    this.translate,
    this.storage,
    {},
    this.messageService,
    this.http,
    this.validationService,
  );

  viewingPermissionsForDataset: Dataset;

  actionComponent = {
    getActions: (row: Pool) => {
      const actions: any[] = [
        {
          name: 'pool_actions',
          title: helptext.pool_actions_title,
          actions: this.conf.getActions(row),
        },
      ];

      if (row.status !== PoolStatus.Offline) {
        const encryptionActions = {
          name: 'encryption_actions',
          title: helptext.encryption_actions_title,
          actions: this.conf.getEncryptedActions(row),
        };
        actions.push(encryptionActions);
      }

      return actions;
    },
    conf: new VolumesListTableConfig(
      this,
      this.router,
      '',
      [],
      this.mdDialog,
      this.ws,
      this.dialogService,
      this.loader,
      this.translate,
      this.storage,
      {},
      this.messageService,
      this.http,
      this.validationService,
    ),
  };

  expanded = false;
  paintMe = true;
  systemdatasetPool: any;
  has_encrypted_root: { [pool: string]: boolean } = {};
  has_key_dataset: { [pool: string]: boolean } = {};
  entityEmptyConf: EmptyConfig = {
    type: EmptyType.first_use,
    large: true,
    title: T('No Pools'),
    message: `${T('It seems you haven\'t configured pools yet.')} ${T('Please click the button below to create a pool.')}`,
    button: {
      label: T('Create pool'),
      action: this.createPool.bind(this),
    },
  };
  protected addZvolComponent: ZvolFormComponent;
  protected addDatasetFormComponent: DatasetFormComponent;
  protected editDatasetFormComponent: DatasetFormComponent;
  protected aroute: ActivatedRoute;
  private refreshTableSubscription: Subscription;
  private datasetQuery: 'pool.dataset.query' = 'pool.dataset.query';
  /*
   * Please note that extra options are special in that they are passed directly to ZFS.
   * This is why 'encryptionroot' is included in order to get 'encryption_root' in the response
   * */
  private datasetQueryOptions: QueryParams<Dataset, ExtraDatasetQueryOptions> = [[], {
    extra: {
      properties: [
        'type',
        'used',
        'available',
        'compression',
        'readonly',
        'dedup',
        'org.freenas:description',
        'compressratio',
        'encryption',
        'encryptionroot',
        'keystatus',
        'keyformat',
        'mountpoint',
      ],
    },
  }];

  readonly PoolStatus = PoolStatus;

  constructor(
    protected core: CoreService,
    protected router: Router,
    public ws: WebSocketService,
    public dialogService: DialogService,
    public loader: AppLoaderService,
    protected mdDialog: MatDialog,
    protected translate: TranslateService,
    public sorter: StorageService,
    protected job: JobService,
    protected storage: StorageService,
    protected pref: PreferencesService,
    protected messageService: MessageService,
    protected http: HttpClient,
    modalService: ModalService,
    public tableService: EntityTableService,
    protected validationService: ValidationService,
  ) {
    super(core, router, ws, dialogService, loader, translate, sorter, job, pref, mdDialog, modalService);

    this.actionsConfig = { actionType: VolumesListControlsComponent, actionConfig: this };
    this.core.emit({ name: 'GlobalActions', data: this.actionsConfig, sender: this });
  }

  repaintMe(): void {
    this.showDefaults = false;
    this.paintMe = false;
    this.ngOnInit();
  }

  ngOnDestroy(): void {
    if (this.refreshTableSubscription) {
      this.refreshTableSubscription.unsubscribe();
    }
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner = true;

    this.systemdatasetPool = await this.ws.call('systemdataset.config').pipe(map((res) => res.pool)).toPromise();

    while (this.zfsPoolRows.length > 0) {
      this.zfsPoolRows.pop();
    }

    this.has_key_dataset = {};
    this.has_encrypted_root = {};
    this.ws.call('pool.dataset.query_encrypted_roots_keys').pipe(untilDestroyed(this)).subscribe((res) => {
      for (const key in res) {
        if (res.hasOwnProperty(key)) {
          const pool = key.split('/')[0];
          this.has_key_dataset[pool] = true;
        }
      }
    });

    if (!this.refreshTableSubscription) {
      this.refreshTableSubscription = this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
        this.repaintMe();
      });
    }

    combineLatest([
      this.ws.call('pool.query', []),
      this.ws.call(this.datasetQuery, this.datasetQueryOptions),
    ]).pipe(untilDestroyed(this)).subscribe(async ([pools, datasets]: [any[], any[]]) => {
      // TODO: Additional fields added on frontend.
      if (pools.length > 0) {
        for (const pool of pools) {
          pool.is_upgraded = await this.ws.call('pool.is_upgraded', [pool.id]).toPromise();
          if (!pool.is_decrypted) {
            pool.status = 'LOCKED';
          }

          /* Filter out system datasets */
          const pChild = datasets.find((set) => set.name === pool.name);
          if (pChild) {
            pChild.children = pChild.children.filter((child: any) => child.name.indexOf(`${pool.name}/.system`) === -1 && child.name.indexOf(`${pool.name}/.glusterfs`) === -1);
          }
          pool.children = pChild ? [pChild] : [];

          pool.volumesListTableConfig = new VolumesListTableConfig(
            this,
            this.router,
            pool.id,
            datasets,
            this.mdDialog,
            this.ws,
            this.dialogService,
            this.loader,
            this.translate,
            this.storage,
            pool,
            this.messageService,
            this.http,
            this.validationService,
          );
          pool.type = 'zpool';

          if (pool.children && pool.children[0]) {
            try {
              pool.children[0].is_encrypted_root = (pool.children[0].id === pool.children[0].encryption_root);
              if (pool.children[0].is_encrypted_root) {
                this.has_encrypted_root[pool.name] = true;
              }
              pool.children[0].available_parsed = this.storage.convertBytestoHumanReadable(
                pool.children[0].available.parsed || 0,
              );
              pool.children[0].used_parsed = this.storage.convertBytestoHumanReadable(
                pool.children[0].used.parsed || 0,
              );
              pool.availStr = filesize(pool.children[0].available.parsed, { standard: 'iec' });
              pool.children[0].has_encrypted_children = false;
              for (let i = 0; i < datasets.length; i++) {
                const ds = datasets[i];
                if (ds['id'].startsWith(pool.children[0].id) && ds.id !== pool.children[0].id && ds.encrypted) {
                  pool.children[0].has_encrypted_children = true;
                  break;
                }
              }
            } catch (error) {
              pool.availStr = '' + pool.children[0].available.parsed;
              pool.children[0].available_parsed = 'Unknown';
              pool.children[0].used_parsed = 'Unknown';
            }

            try {
              const used_pct = pool.children[0].used.parsed
                / (pool.children[0].used.parsed + pool.children[0].available.parsed);
              pool.usedStr = '' + filesize(pool.children[0].used.parsed, { standard: 'iec' }) + ' (' + Math.round(used_pct * 100) + '%)';
            } catch (error) {
              pool.usedStr = '' + pool.children[0].used.parsed;
            }
          }

          this.zfsPoolRows.push(pool);
        }
      }

      this.zfsPoolRows = this.sorter.tableSorter(this.zfsPoolRows, 'name', 'asc');

      if (this.zfsPoolRows.length === 1) {
        this.expanded = true;
      }

      this.paintMe = true;

      this.showDefaults = true;
      this.showSpinner = false;
    }, (res) => {
      this.showDefaults = true;
      this.showSpinner = false;

      this.dialogService.errorReport(T('Error getting pool data.'), res.message, res.stack);
    });

    this.addZvolComponent = new ZvolFormComponent(this.router, this.aroute, this.ws, this.loader,
      this.dialogService, this.storageService, this.translate, this.modalService);

    this.addDatasetFormComponent = new DatasetFormComponent(
      this.router, this.aroute, this.ws, this.loader, this.dialogService, this.storageService, this.modalService,
    );
  }

  addZvol(id: string, isNew: boolean): void {
    this.addZvolComponent = new ZvolFormComponent(this.router, this.aroute, this.ws, this.loader,
      this.dialogService, this.storageService, this.translate, this.modalService);
    this.addZvolComponent.setParent(id);
    this.addZvolComponent.isNew = isNew;
    this.modalService.open('slide-in-form', this.addZvolComponent, id);
  }

  addDataset(pool: any, id: string): void {
    this.addDatasetFormComponent.setParent(id);
    this.addDatasetFormComponent.setVolId(pool);
    this.addDatasetFormComponent.setTitle(T('Add Dataset'));
    this.modalService.open('slide-in-form', this.addDatasetFormComponent, id);
  }

  editDataset(pool: string, id: string): void {
    this.editDatasetFormComponent = new DatasetFormComponent(
      this.router, this.aroute, this.ws, this.loader, this.dialogService, this.storageService, this.modalService,
    );

    this.editDatasetFormComponent.setPk(id);
    this.editDatasetFormComponent.setVolId(pool);
    this.editDatasetFormComponent.setTitle(T('Edit Dataset'));
    this.modalService.open('slide-in-form', this.editDatasetFormComponent, id);
  }

  createPool(): void {
    this.router.navigate(['/storage/manager']);
  }

  onPermissionsSidebarClosed(): void {
    this.viewingPermissionsForDataset = null;
  }
}
