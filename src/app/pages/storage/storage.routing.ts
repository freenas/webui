import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DatasetPermissionsComponent } from './volumes/datasets/dataset-permissions/'
import { SnapshotAddComponent } from './snapshots/snapshot-add/';
import { SnapshotCloneComponent } from './snapshots/snapshot-clone/';
import { SnapshotListComponent } from './snapshots/snapshot-list/';
import { SnapshotRollbackComponent } from './snapshots/snapshot-rollback/';
import { DatasetFormComponent } from './volumes/datasets/dataset-form/';
import { ManagerComponent } from './volumes/manager/';
// import { VolumesEditComponent } from './volumes-edit/index';
import { VolumeDeleteComponent } from './volumes/volume-delete/index';
import { VolumesListComponent } from './volumes/volumes-list/';
import { ZvolFormComponent } from './volumes/zvol/zvol-form/';
import { VMwareSnapshotFormComponent } from './VMware-snapshot/VMware-snapshot';
import { VMwareSnapshotListComponent } from './VMware-snapshot/VMware-snapshot-list';
import { ImportDiskComponent } from './import-disk/import-disk.component';
import { DiskListComponent } from './disks/disk-list/';
import { DiskFormComponent } from './disks/disk-form/';
import { DiskBulkEditComponent } from './disks/disk-bulk-edit';
import { DiskWipeComponent } from './disks/disk-wipe/disk-wipe.component';
import { VolumeAddkeyFormComponent } from 'app/pages/storage/volumes/volumeaddkey-form';
import { VolumeRekeyFormComponent } from 'app/pages/storage/volumes/volumerekey-form';
import { VolumeCreatekeyFormComponent } from 'app/pages/storage/volumes/volumecreatekey-form';
import { VolumeChangekeyFormComponent } from 'app/pages/storage/volumes/volumechangekey-form';
import { VolumeImportWizardComponent} from './volumes/volume-import-wizard';
import { VolumeStatusComponent } from './volumes/volume-status';
import { EntityDashboardComponent } from '../common/entity/entity-dashboard/entity-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Storage' },
    children: [
      {
        path: '',
        component: EntityDashboardComponent,
      },
      {
        path: 'pools',
        data: { title: 'Pools', breadcrumb: 'Pools', icon: 'view_stream' },
        children: [
          {
            path: '', component: VolumesListComponent,
            data: { title: 'Pools', breadcrumb: 'Pools' }
          },
          {
            path: 'id/:volid/dataset/add/:parent', component: DatasetFormComponent,
            data: { title: 'Add Dataset', breadcrumb: 'Add Dataset' }
          },
          {
            path: 'id/:volid/dataset/edit/:pk', component: DatasetFormComponent,
            data: { title: 'Edit Dataset', breadcrumb: 'Edit Dataset' }
          },
          {
            path: 'id/:pk/zvol/add/:path', component: ZvolFormComponent,
            data: { title: 'Add Zvol', breadcrumb: 'Add Zvol' }
          },
          {
            path: 'id/:pk/zvol/edit/:path', component: ZvolFormComponent,
            data: { title: 'Edit Zvol', breadcrumb: 'Edit Zvol' }
          },
          {
            path: 'id/:pk/dataset/permissions/:path', component: DatasetPermissionsComponent,
            data: { title: 'Edit Permissions', breadcrumb: 'Edit Permissions' }
          },
          {
            path: 'manager', component: ManagerComponent,
            data: { title: 'Create Pool', breadcrumb: 'Create Pool' }
          },
          {
            path: 'manager/:pk', component: ManagerComponent,
            data: { title: 'Extend Pool', breadcrumb: 'Extend Pool' }
          },
          {
            path: 'import', component: VolumeImportWizardComponent,
            data: { title: 'Import Pool', breadcrumb: 'Import Pool' }
          },
          {
            path: 'status/:pk', component: VolumeStatusComponent,
            data: { title: 'Pool Status', breadcrumb: 'Pool Status' }
          },
          {
            path: 'detachvolume/:pk', component: VolumeDeleteComponent,
            data: { title: 'Detach Pool', breadcrumb: 'Detach Pool' }
          },
          {
            path: 'rekey/:pk', component: VolumeRekeyFormComponent,
            data: { title: 'Rekey Pool', breadcrumb: 'Rekey Pool' }
          },
          {
            path: 'addkey/:pk', component: VolumeAddkeyFormComponent,
            data: { title: 'Add Key', breadcrumb: 'Add Key' }
          },
          {
            path: 'createkey/:pk', component: VolumeCreatekeyFormComponent,
            data: { title: 'Create Passphrase', breadcrumb: 'Create Passphrase' }
          },
          {
            path: 'changekey/:pk', component: VolumeChangekeyFormComponent,
            data: { title: 'Change Passphrase', breadcrumb: 'Change Passphrase' }
          }
        ]
      },
      {
        path: 'snapshots',
        data: { title: 'Snapshots', breadcrumb: 'Snapshots', icon: 'camera_alt' },
        children: [
          {
            path: '', component: SnapshotListComponent,
            data: { title: 'Snapshots', breadcrumb: 'Snapshots' }
          },
          {
            path: 'clone/:pk', component: SnapshotCloneComponent,
            data: { title: 'Clone', breadcrumb: 'Clone' }
          },
          {
            path: 'rollback/:pk', component: SnapshotRollbackComponent,
            data: { title: 'Rollback', breadcrumb: 'Rollback' }
          },
          {
            path: 'add', component: SnapshotAddComponent,
            data: { title: 'Add', breadcrumb: 'Add' }
          }
        ]
      },
      {
        path: 'vmware-Snapshots',
        data: { title: 'VMware Snapshots', breadcrumb: 'VMware Snapshots', icon: 'camera_alt' },
        children: [
          {
            path: '', component: VMwareSnapshotListComponent,
            data: { title: 'VMware Snapshots', breadcrumb: 'VMware Snapshots' }
          },
          {
            path: 'add', component: VMwareSnapshotFormComponent,
            data: { title: 'Add', breadcrumb: 'Add' }
          },
          {
            path: 'edit/:pk', component: VMwareSnapshotFormComponent,
            data: { title: 'Edit', breadcrumb: 'Edit' }
          }

        ]
      },
      {
        path: 'disks',
        data: { title: 'Disks', breadcrumb: 'Disks', icon: 'view_stream' },
        children: [
          {
            path: '', component: DiskListComponent,
            data: { title: 'Disks', breadcrumb: 'Disks' }
          },
          {
            path: 'edit/:pk', component: DiskFormComponent,
            data: { title: 'Edit Disk', breadcrumb: 'Edit Disk' }
          },
          {
            path: 'bulk-edit', component: DiskBulkEditComponent,
            data: { title: 'Bulk Edit Disks', breadcrumb: 'Bulk Edit Disks' }
          },
          {
            path: 'pool/:poolId/edit/:pk', component: DiskFormComponent,
            data: { title: 'Edit Pool Disk', breadcrumb: 'Edit Pool Disk' }
          },
          {
            path: 'wipe/:pk', component: DiskWipeComponent,
            data: { title: 'Wipe Disk', breadcrumb: 'Wipe Disk' }
          }
        ]
      },
      {
        path: 'import-disk', component: ImportDiskComponent,
        data: { title: 'Import Disk', breadcrumb: 'Import Disk', icon: 'view_stream' }
      }
    ]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
