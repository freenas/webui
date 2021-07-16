import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angular2-qrcode';
import { MarkdownModule } from 'ngx-markdown';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { SystemDatasetPoolComponent } from 'app/pages/system/advanced/system-dataset-pool/system-dataset-pool.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-servers/ntp-server-form/ntp-server-form.component';
import { ManualUpdateComponent } from 'app/pages/system/update/manual-update/manual-update.component';
import { EntityModule } from '../common/entity/entity.module';
import { AdvancedSettingsComponent } from './advanced/advanced-settings.component';
import { ConsoleFormComponent } from './advanced/console-form/console-form.component';
import { CronFormComponent } from './advanced/cron/cron-form/cron-form.component';
import { CronListComponent } from './advanced/cron/cron-list/cron-list.component';
import { InitshutdownFormComponent } from './advanced/initshutdown/initshutdown-form/initshutdown-form.component';
import { InitshutdownListComponent } from './advanced/initshutdown/initshutdown-list/initshutdown-list.component';
import { IsolatedGpuPcisFormComponent } from './advanced/isolated-gpu-pcis/isolated-gpu-pcis-form.component';
import { KernelFormComponent } from './advanced/kernel-form/kernel-form.component';
import { SyslogFormComponent } from './advanced/syslog-form/syslog-form.component';
import { AlertServiceComponent } from './alert-service/alert-service/alert-service.component';
import { AlertConfigComponent } from './alert/alert.component';
import { BootEnvAttachFormComponent } from './bootenv/bootenv-attach/bootenv-attach-form.component';
import { BootEnvironmentCloneComponent } from './bootenv/bootenv-clone/bootenv-clone.component';
import { BootEnvironmentCreateComponent } from './bootenv/bootenv-create/bootenv-create.component';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/bootenv-list.component';
import { BootEnvironmentRenameComponent } from './bootenv/bootenv-rename/bootenv-rename.component';
import { BootEnvReplaceFormComponent } from './bootenv/bootenv-replace/bootenv-replace-form.component';
import { BootStatusListComponent } from './bootenv/bootenv-status/bootenv-status.component';
import { EmailComponent } from './email/email.component';
import { FailoverComponent } from './failover/failover.component';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { GuiFormComponent } from './general-settings/gui-form/gui-form.component';
import { LocalizationFormComponent } from './general-settings/localization-form/localization-form.component';
import { EulaComponent } from './general-settings/support/eula/eula.component';
import { LicenseComponent } from './general-settings/support/license/license.component';
import { ProactiveComponent } from './general-settings/support/proactive/proactive.component';
import { SupportFormLicensedComponent } from './general-settings/support/support-licensed/support-form-licensed.component';
import { SupportFormUnlicensedComponent } from './general-settings/support/support-unlicensed/support-form-unlicensed.component';
import { SupportComponent } from './general-settings/support/support.component';
import { SysInfoComponent } from './general-settings/support/sys-info/sys-info.component';
import { KmipComponent } from './kmip/kmip.component';
import { routing } from './system.routing';
import { TunableFormComponent } from './tunable/tunable-form/tunable-form.component';
import { TunableListComponent } from './tunable/tunable-list/tunable-list.component';
import { TwoFactorComponent, QRDialog } from './two-factor/two-factor.component';
import { UpdateComponent } from './update/update.component';
import { EnclosureModule } from './view-enclosure/enclosure.module';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgxUploaderModule, routing,
    MaterialModule, MarkdownModule.forRoot(), TranslateModule, FlexLayoutModule,
    EnclosureModule, CommonDirectivesModule, QRCodeModule,
  ],
  declarations: [
    AdvancedSettingsComponent,
    BootEnvironmentListComponent,
    BootEnvironmentCloneComponent,
    BootEnvironmentRenameComponent,
    BootEnvironmentCreateComponent,
    BootStatusListComponent,
    BootEnvAttachFormComponent,
    BootEnvReplaceFormComponent,
    TunableListComponent,
    TunableFormComponent,
    UpdateComponent,
    ManualUpdateComponent,
    NtpServerFormComponent,
    AlertServiceListComponent,
    SupportComponent,
    EmailComponent,
    AlertServiceComponent,
    AlertConfigComponent,
    FailoverComponent,
    EulaComponent,
    ProactiveComponent,
    SupportFormLicensedComponent,
    SupportFormUnlicensedComponent,
    SysInfoComponent,
    KmipComponent,
    TwoFactorComponent,
    QRDialog,
    GeneralSettingsComponent,
    LocalizationFormComponent,
    GuiFormComponent,
    LicenseComponent,
    ConsoleFormComponent,
    IsolatedGpuPcisFormComponent,
    KernelFormComponent,
    SyslogFormComponent,
    InitshutdownFormComponent,
    InitshutdownListComponent,
    CronFormComponent,
    CronListComponent,
    SystemDatasetPoolComponent,
  ],
  entryComponents: [QRDialog],
  providers: [],
})
export class SystemModule {}
