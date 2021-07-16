import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { MaterialModule } from 'app/app-material.module';
import { ResilverComponent } from 'app/pages/data-protection/scrub/resilver/resilver.component';
import { EntityModule } from '../common/entity/entity.module';
import { CloudsyncFormComponent } from './cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudsyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { DataProtectionDashboardComponent } from './components/data-protection-dashboard/data-protection-dashboard.component';
import { DataProtectionRoutes } from './data-protection.routing';
import { ReplicationFormComponent } from './replication/replication-form/replication-form.component';
import { ReplicationListComponent } from './replication/replication-list/replication-list.component';
import { ReplicationWizardComponent } from './replication/replication-wizard/replication-wizard.component';
import { RsyncFormComponent } from './rsync/rsync-form/rsync-form.component';
import { RsyncListComponent } from './rsync/rsync-list/rsync-list.component';
import { ScrubFormComponent } from './scrub/scrub-form/scrub-form.component';
import { ScrubListComponent } from './scrub/scrub-list/scrub-list.component';
import { SmartFormComponent } from './smart/smart-form/smart-form.component';
import { SmartListComponent } from './smart/smart-list/smart-list.component';
import { SnapshotFormComponent } from './snapshot/snapshot-form/snapshot-form.component';
import { SnapshotListComponent } from './snapshot/snapshot-list/snapshot-list.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    RouterModule.forChild(DataProtectionRoutes),
    EntityModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  declarations: [
    SnapshotListComponent,
    SnapshotFormComponent,
    RsyncListComponent,
    RsyncFormComponent,
    SmartListComponent,
    SmartFormComponent,
    ReplicationListComponent,
    ReplicationFormComponent,
    ReplicationWizardComponent,
    ScrubListComponent,
    ScrubFormComponent,
    CloudsyncListComponent,
    CloudsyncFormComponent,
    DataProtectionDashboardComponent,
    ResilverComponent,
  ],
})
export class DataProtectionModule {}
