import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PreferencesService } from 'app/core/services/preferences.service';
import helptext from 'app/helptext/account/group-list';
import { Group } from 'app/interfaces/group.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';
import { WebSocketService } from 'app/services/ws.service';
import { T } from 'app/translate-marker';
import { GroupFormComponent } from '../group-form/group-form.component';

@UntilDestroy()
@Component({
  selector: 'app-group-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class GroupListComponent implements EntityTableConfig<Group>, OnInit {
  title = 'Groups';
  queryCall: 'group.query' = 'group.query';
  wsDelete: 'group.delete' = 'group.delete';
  route_add = ['account', 'groups', 'add'];
  protected route_add_tooltip = T('Add Group');
  route_edit: string[] = ['account', 'groups', 'edit'];
  protected entityList: EntityTableComponent;
  protected loaderOpen = false;
  globalConfig = {
    id: 'config',
    tooltip: helptext.globalConfigTooltip,
    onClick: () => {
      this.toggleBuiltins();
    },
  };
  addComponent: GroupFormComponent;

  columns = [
    { name: 'Group', prop: 'group', always_display: true },
    { name: 'GID', prop: 'gid' },
    { name: 'Builtin', prop: 'builtin' },
    { name: 'Permit Sudo', prop: 'sudo' },
    { name: 'Samba Authentication', prop: 'smb', hidden: true },
  ];
  rowIdentifier = 'group';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Group'),
      key_props: ['group'],
    },
  };

  constructor(private _router: Router, protected dialogService: DialogService,
    protected loader: AppLoaderService, protected ws: WebSocketService,
    protected prefService: PreferencesService, private translate: TranslateService,
    protected aroute: ActivatedRoute, private modalService: ModalService) {}

  ngOnInit(): void {
    this.refreshGroupForm();
    this.modalService.refreshForm$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshGroupForm();
    });
  }

  refreshGroupForm(): void {
    this.addComponent = new GroupFormComponent(this._router, this.ws, this.modalService);
  }

  resourceTransformIncomingRestData(data: Group[]): Group[] {
    // Default setting is to hide builtin groups
    if (this.prefService.preferences.hide_builtin_groups) {
      const newData: Group[] = [];
      data.forEach((item) => {
        if (!item.builtin) {
          newData.push(item);
        }
      });
      return data = newData;
    }
    return data;
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    setTimeout(() => {
      if (this.prefService.preferences.showGroupListMessage) {
        this.showOneTimeBuiltinMsg();
      }
    }, 2000);

    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  isActionVisible(actionId: string, row: Group): boolean {
    if (actionId === 'delete' && row.builtin === true) {
      return false;
    }
    return true;
  }

  getActions(row: Group): EntityTableAction[] {
    const actions = [];
    actions.push({
      id: row.group,
      name: helptext.group_list_actions_id_member,
      label: helptext.group_list_actions_label_member,
      icon: 'people',
      onClick: (members: Group) => {
        this._router.navigate(new Array('/').concat(
          ['credentials', 'groups', 'members', String(members.id)],
        ));
      },
    });
    if (row.builtin === !true) {
      actions.push({
        id: row.group,
        icon: 'edit',
        label: helptext.group_list_actions_label_edit,
        name: helptext.group_list_actions_id_edit,
        onClick: (members_edit: Group) => {
          this.modalService.open('slide-in-form', this.addComponent, members_edit.id);
        },
      });
      actions.push({
        id: row.group,
        icon: 'delete',
        name: 'delete',
        label: helptext.group_list_actions_label_delete,
        onClick: (members_delete: Group) => {
          const self = this;
          this.loader.open();
          self.ws.call('user.query', [[['group.id', '=', members_delete.id]]]).pipe(untilDestroyed(this)).subscribe(
            (usersInGroup) => {
              this.loader.close();

              const conf: DialogFormConfiguration = {
                title: helptext.deleteDialog.title,
                message: helptext.deleteDialog.message + `<i>${members_delete.group}</i>?`,
                fieldConfig: [],
                confirmCheckbox: true,
                saveButtonText: helptext.deleteDialog.saveButtonText,
                preInit() {
                  if (!usersInGroup.length) {
                    return;
                  }
                  conf.fieldConfig.push({
                    type: 'checkbox',
                    name: 'delete_users',
                    placeholder: T(`Delete ${usersInGroup.length} user(s) with this primary group?`),
                    value: false,
                    onChange: (valueChangeData: { event: MatCheckboxChange }) => {
                      if (valueChangeData.event.checked) {
                        self.dialogService.Info('Following users will be deleted', usersInGroup.map((user, index) => {
                          if (user.full_name && user.full_name.length) {
                            return (index + 1) + '. ' + user.username + ' (' + user.full_name + ')';
                          }
                          return (index + 1) + '. ' + user.username;
                        }).join('\n'));
                      }
                    },
                  });
                },
                customSubmit(entityDialog: EntityDialogComponent) {
                  entityDialog.dialogRef.close(true);
                  self.loader.open();
                  self.ws.call(self.wsDelete, [members_delete.id, entityDialog.formValue])
                    .pipe(untilDestroyed(this))
                    .subscribe(() => {
                      self.entityList.getData();
                      self.loader.close();
                    },
                    (err) => {
                      new EntityUtils().handleWSError(self, err, self.dialogService);
                      self.loader.close();
                    });
                },
              };
              this.dialogService.dialogForm(conf);
            }, (err) => {
              this.loader.close();
              new EntityUtils().handleWSError(self, err, self.dialogService);
            },
          );
        },
      });
    }

    return actions as EntityTableAction[];
  }

  toggleBuiltins(): void {
    const show = this.prefService.preferences.hide_builtin_groups
      ? helptext.builtins_dialog.show
      : helptext.builtins_dialog.hide;
    this.translate.get(show).pipe(untilDestroyed(this)).subscribe((action: string) => {
      this.translate.get(helptext.builtins_dialog.title).pipe(untilDestroyed(this)).subscribe((title: string) => {
        this.translate.get(helptext.builtins_dialog.message).pipe(untilDestroyed(this)).subscribe((message: string) => {
          this.dialogService.confirm(action + title,
            action + message, true, action)
            .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
              if (res) {
                this.prefService.preferences.hide_builtin_groups = !this.prefService.preferences.hide_builtin_groups;
                this.prefService.savePreferences();
                this.entityList.getData();
              }
            });
        });
      });
    });
  }

  showOneTimeBuiltinMsg(): void {
    this.prefService.preferences.showGroupListMessage = false;
    this.prefService.savePreferences();
    this.dialogService.confirm(helptext.builtinMessageDialog.title, helptext.builtinMessageDialog.message,
      true, helptext.builtinMessageDialog.button, false, '', '', '', '', true);
  }

  doAdd(): void {
    this.modalService.open('slide-in-form', this.addComponent);
  }
}
