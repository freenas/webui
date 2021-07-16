import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/services/components/service-tftp';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { TftpConfig } from 'app/interfaces/tftp-config.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { UserService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'tftp-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ServiceTFTPComponent implements FormConfiguration {
  queryCall: 'tftp.config' = 'tftp.config';
  route_success: string[] = ['services'];
  title = helptext.formTitle;

  fieldSets: FieldSet[] = [
    {
      name: helptext.tftp_fieldset_path,
      label: true,
      width: '50%',
      config: [{
        type: 'explorer',
        initial: '/mnt',
        explorerType: 'directory',
        name: 'directory',
        placeholder: helptext.tftp_directory_placeholder,
        tooltip: helptext.tftp_directory_tooltip,
      }],
    },
    {
      name: helptext.tftp_fieldset_conn,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'host',
          placeholder: helptext.tftp_host_placeholder,
          tooltip: helptext.tftp_host_tooltip,
        },
        {
          type: 'input',
          name: 'port',
          placeholder: helptext.tftp_port_placeholder,
          tooltip: helptext.tftp_port_tooltip,
        },
        {
          type: 'combobox',
          name: 'username',
          placeholder: helptext.tftp_username_placeholder,
          tooltip: helptext.tftp_username_tooltip,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
        },
      ],
    },
    { name: 'divider', divider: true },
    {
      name: helptext.tftp_fieldset_access,
      label: true,
      width: '50%',
      config: [
        {
          type: 'permissions',
          name: 'umask',
          hideOthersPermissions: true,
          placeholder: helptext.tftp_umask_placeholder,
          tooltip: helptext.tftp_umask_tooltip,
        },
        {
          type: 'checkbox',
          name: 'newfiles',
          placeholder: helptext.tftp_newfiles_placeholder,
          tooltip: helptext.tftp_newfiles_tooltip,
        },
      ],
    },
    {
      name: helptext.tftp_fieldset_other,
      label: true,
      width: '50%',
      config: [{
        type: 'textarea',
        name: 'options',
        placeholder: helptext.tftp_options_placeholder,
        tooltip: helptext.tftp_options_tooltip,
      }],
    },
    { name: 'divider', divider: true },
  ];

  protected tftp_username: FieldConfig;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected userService: UserService,
  ) {}

  resourceTransformIncomingRestData(data: TftpConfig): { umask: string } {
    return invertUMask(data);
  }

  beforeSubmit(data: any): { umask: string } {
    return invertUMask(data);
  }

  preInit(): void {
    this.userService.userQueryDSCache().pipe(untilDestroyed(this)).subscribe((items) => {
      const users: Option[] = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      this.tftp_username = this.fieldSets
        .find((set) => set.name === helptext.tftp_fieldset_conn)
        .config.find((config) => config.name === 'username');
      this.tftp_username.options = users;
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    entityEdit.submitFunction = (body) => this.ws.call('tftp.update', [body]);
  }

  updateUserSearchOptions(value = '', parent: any): void {
    (parent.userService as UserService).userQueryDSCache(value).pipe(untilDestroyed(this)).subscribe((items) => {
      const users: Option[] = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      parent.tftp_username.searchOptions = users;
    });
  }
}

/**
 * Need to invert the umask prop on the way in/out.
 * The 'permissions' FieldConfig and the MW expect opposite values.
 */
function invertUMask(data: { umask: string }): { umask: string } {
  const perm = parseInt(data['umask'], 8);
  let mask = (~perm & 0o666).toString(8);
  while (mask.length < 3) {
    mask = '0' + mask;
  }
  data['umask'] = mask;

  return data;
}
