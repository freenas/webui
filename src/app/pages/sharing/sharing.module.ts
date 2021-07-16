import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { UserService } from 'app/services/user.service';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';
import { EntityModule } from '../common/entity/entity.module';
import { SharesDashboardComponent } from './components/shares-dashboard/shares-dashboard.component';
import { AssociatedTargetFormComponent } from './iscsi/associated-target/associated-target-form/associated-target-form.component';
import { AssociatedTargetListComponent } from './iscsi/associated-target/associated-target-list/associated-target-list.component';
import { AuthorizedAccessFormComponent } from './iscsi/authorizedaccess/authorizedaccess-form/authorizedaccess-form.component';
import { AuthorizedAccessListComponent } from './iscsi/authorizedaccess/authorizedaccess-list/authorizedaccess-list.component';
import { ExtentFormComponent } from './iscsi/extent/extent-form/extent-form.component';
import { ExtentListComponent } from './iscsi/extent/extent-list/extent-list.component';
import { FibreChannelPortComponent } from './iscsi/fibre-channel-ports/fibre-channel-port/fibre-channel-port.component';
import { FibreChannelPortsComponent } from './iscsi/fibre-channel-ports/fibre-channel-ports.component';
import { GlobalconfigurationComponent } from './iscsi/globalconfiguration/globalconfiguration.component';
import { DynamicListComponent } from './iscsi/initiator/initiator-form/dynamic-list/dynamic-list-component';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form/initiator-form.component';
import { InitiatorListComponent } from './iscsi/initiator/initiator-list/initiator-list.component';
import { IscsiWizardComponent } from './iscsi/iscsi-wizard/iscsi-wizard.component';
import { ISCSI } from './iscsi/iscsi.component';
import { PortalFormComponent } from './iscsi/portal/portal-form/portal-form.component';
import { PortalListComponent } from './iscsi/portal/portal-list/portal-list.component';
import { TargetFormComponent } from './iscsi/target/target-form/target-form.component';
import { TargetListComponent } from './iscsi/target/target-list/target-list.component';
import { NFSFormComponent } from './nfs/nfs-form/nfs-form.component';
import { NFSListComponent } from './nfs/nfs-list/nfs-list.component';
import { routing } from './sharing.routing';
import { SMBAclComponent } from './smb/smb-acl/smb-acl.component';
import { SMBFormComponent } from './smb/smb-form/smb-form.component';
import { SMBListComponent } from './smb/smb-list/smb-list.component';
import { WebdavFormComponent } from './webdav/webdav-form/webdav-form.component';
import { WebdavListComponent } from './webdav/webdav-list/webdav-list.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    routing,
    EntityModule,
    MaterialModule,
    TranslateModule,
    FlexLayoutModule,
    CommonDirectivesModule,
  ],
  declarations: [
    NFSListComponent,
    NFSFormComponent,
    SharesDashboardComponent,
    WebdavListComponent,
    WebdavFormComponent,
    SMBListComponent,
    SMBFormComponent,
    SMBAclComponent,
    ISCSI,
    IscsiWizardComponent,
    GlobalconfigurationComponent,
    PortalListComponent,
    PortalFormComponent,
    DynamicListComponent,
    InitiatorListComponent,
    InitiatorFormComponent,
    AuthorizedAccessListComponent,
    AuthorizedAccessFormComponent,
    TargetListComponent,
    TargetFormComponent,
    ExtentListComponent,
    ExtentFormComponent,
    AssociatedTargetListComponent,
    AssociatedTargetFormComponent,
    FibreChannelPortsComponent,
    FibreChannelPortComponent,
  ],
  providers: [
    EntityFormService,
    UserService,
  ],
  entryComponents: [FibreChannelPortComponent],
})
export class SharingModule {
}
