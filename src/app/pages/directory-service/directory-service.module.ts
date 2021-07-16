import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/app-material.module';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/active-directory/active-directory.component';
import { routing } from 'app/pages/directory-service/directory-service.routing';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/kerberos-keytabs/kerberos-keytabs-form.component';
import { KerberosKeytabsListComponent } from 'app/pages/directory-service/kerberos-keytabs/kerberos-keytabs-list.component';
import { KerberosRealmsFormComponent } from 'app/pages/directory-service/kerberos-realms/kerberos-realms-form.component';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/kerberos-realms/kerberos-realms-list.component';
import { KerberosSettingsComponent } from 'app/pages/directory-service/kerberos-settings/kerberos-settings.component';
import { SystemGeneralService } from 'app/services';
import { EntityModule } from '../common/entity/entity.module';
import { IdmapFormComponent } from './idmap/idmap-form.component';
import { IdmapListComponent } from './idmap/idmap-list.component';
import { LdapComponent } from './ldap/ldap.component';
import { NISComponent } from './nis/nis.component';

@NgModule({
  imports: [
    CommonModule, EntityModule, FormsModule, ReactiveFormsModule, FlexLayoutModule,
    NgxUploaderModule, routing, MaterialModule, TranslateModule,
  ],
  declarations: [
    LdapComponent,
    ActiveDirectoryComponent,
    NISComponent,
    KerberosRealmsListComponent,
    KerberosRealmsFormComponent,
    KerberosSettingsComponent,
    KerberosKeytabsListComponent,
    KerberosKeytabsFormComponent,
    IdmapListComponent,
    IdmapFormComponent,
    DirectoryServicesComponent,
  ],
  providers: [SystemGeneralService],
}) export class DirectoryServiceModule { }
