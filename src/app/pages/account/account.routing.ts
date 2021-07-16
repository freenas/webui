import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';
import { T } from 'app/translate-marker';
import { BackupCredentialsComponent } from '../credentials/backup-credentials/backup-credentials.component';
import { CertificatesDashComponent } from '../credentials/certificates-dash/certificates-dash.component';
import { TwoFactorComponent } from '../system/two-factor/two-factor.component';
import { MembersComponent } from './groups/members/members.component';
import { ChangePasswordComponent } from './users/change-password/change-password.component';
import { UserFormComponent } from './users/user-form/user-form.component';
import { UserListComponent } from './users/user-list/user-list.component';

export const routes: Routes = [{
  path: '',
  data: { title: 'Accounts' },
  children: [
    {
      path: 'users',
      data: { title: 'Users', breadcrumb: 'Users', icon: 'group' },
      children: [{
        path: '',
        component: UserListComponent,
        data: { title: 'Users', breadcrumb: 'Users' },
      }, {
        path: 'add',
        component: UserFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },
      {
        path: 'edit/:pk',
        component: UserFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }, {
        path: 'change-password',
        component: ChangePasswordComponent,
        data: { title: 'Change Password', breadcrumb: 'Change Password' },
      },
      ],
    }, {
      path: 'groups',
      data: { title: 'Groups', breadcrumb: 'Groups', icon: 'group_work' },
      children: [{
        path: '',
        component: GroupListComponent,
        data: { title: 'Groups', breadcrumb: 'Groups' },
      }, {
        path: 'add',
        component: GroupFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },
      {
        path: 'edit/:pk',
        component: GroupFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }, {
        path: 'members/:pk',
        component: MembersComponent,
        data: { title: 'Update Members', breadcrumb: 'Members' },
      },
      ],
    },
    {
      path: 'two-factor',
      component: TwoFactorComponent,
      data: { title: ('Two-Factor Auth'), breadcrumb: ('Two-Factor Auth') },
    },

    // Temporary dashboards attached to accounts for now
    {
      path: 'directory-services',
      component: DirectoryServicesComponent,
      data: { title: ('Directory Services') },
    },
    {
      path: 'backup-credentials',
      component: BackupCredentialsComponent,
      data: { title: ('Backup Credentials'), breadcrumb: T('Backup Credentials') },
    },
    {
      path: 'certificates',
      component: CertificatesDashComponent,
      data: { title: ('Certificates'), breadcrumb: T('Certificates') },
    },
  ],
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
