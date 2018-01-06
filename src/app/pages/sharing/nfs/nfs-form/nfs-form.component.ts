import { Component, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray } from '@angular/forms';
import * as _ from 'lodash';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { UserService } from '../../../../services/user.service';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';

@Component({
  selector : 'app-nfs-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class NFSFormComponent {

  protected route_success: string[] = [ 'sharing', 'nfs' ];
  protected resource_name: string = 'sharing/nfs/';
  protected isEntity: boolean = true;
  protected formArray: FormArray;
  protected isBasicMode: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'array',
      name : 'nfs_paths',
      initialCount: 1,
      formarray: [{
        name: 'path',
        placeholder: 'Path',
        tooltip: 'Browse to the volume or dataset to be shared. Click\
 <b>Add extra path</b> to select multiple paths.',
        type: 'explorer',
        initial: '/mnt',
      },
      {
        type: 'checkbox',
        name: 'delete',
        placeholder: 'Delete',
      }]
    },
    {
      type: 'input',
      name: 'nfs_comment',
      placeholder: 'Comment',
      tooltip: 'Set the share name. If left empty, share name is the\
 list of selected <b>Path</b> entries.',
    },
    {
      type: 'textarea',
      name : 'nfs_network',
      placeholder : 'Network',
    },
    {
      type: 'textarea',
      name: 'nfs_hosts',
      placeholder: 'Hosts',
    },
    {
      type: 'checkbox',
      name: 'nfs_alldirs',
      placeholder: 'All dirs',
      tooltip: 'When checked, allow the client to mount any subdirectory\
 within the <b>Path</b>.',
    },
    {
      type: 'checkbox',
      name: 'nfs_ro',
      placeholder: 'Read Only',
      tooltip: 'Prohibit writing to the share.',
    },
    {
      type: 'checkbox',
      name: 'nfs_quiet',
      placeholder: 'Quiet',
      tooltip: 'Inhibit otherwise-useful syslog diagnostics to avoid\
 some annoying error messages. See\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=exports"\
 target="_blank">exports(5)</a> for examples.',
    },
    {
      type: 'textarea',
      name: 'nfs_network',
      placeholder: 'Authorized Networks',
      tooltip: 'Space-delimited list of allowed networks in network/mask\
 CIDR notation\ (e.g. <i>1.2.3.0/24</i>). Leave empty to allow all.',
    },
       {
      type: 'textarea',
      name: 'nfs_hosts',
      placeholder: 'Authorized Hosts and IP addresses',
      tooltip: 'Space-delimited list of allowed IP addresses or\
 hostnames. Leave empty to allow all.',
    },
    {
      type: 'select',
      name: 'nfs_maproot_user',
      placeholder: 'Maproot User',
      tooltip: 'When a user is selected, the <i>root</i> user is\
 limited to the permissions of that user.',
      options: []
    },
    {
      type: 'select',
      name: 'nfs_maproot_group',
      placeholder: 'Maproot Group',
      tooltip: 'When a group is selected, the <i>root</i> user is also\
 limited to the permissions of that group.',
      options: []
    },
    {
      type: 'select',
      name: 'nfs_mapall_user',
      placeholder: 'Mapall User',
      tooltip: 'The specified permissions of that user are used by all\
 clients.',
      options: []
    },
    {
      type: 'select',
      name: 'nfs_mapall_group',
      placeholder: 'Mapall Group',
      tooltip: 'The specified permissions of that group are used by all\
 clients.',
      options: []
    },
  ];

  protected arrayControl: any;
  protected initialCount: number = 1;
  protected initialCount_default: number = 1;

  public custActions: Array<any> = [
    {
      id : 'add_path',
      name : 'Add Additional Path',
      function : () => {
        this.initialCount += 1;
        this.entityFormService.insertFormArrayGroup(
            this.initialCount, this.formArray, this.arrayControl.formarray);
      }
    },
    {
      id : 'remove_path',
      name : 'Remove Additional Path',
      function : () => {
        this.initialCount -= 1;
        this.entityFormService.removeFormArrayGroup(this.initialCount,
                                                    this.formArray);
      }
    },
    {
      id : 'basic_mode',
      name : 'Basic Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : 'Advanced Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  private nfs_maproot_user: any;
  private nfs_maproot_group: any;
  private nfs_mapall_user: any;
  private nfs_mapall_group: any;

  protected advanced_field: Array<any> = [
    'nfs_quiet',
    'nfs_network',
    'nfs_hosts',
    'nfs_maproot_user',
    'nfs_maproot_group',
    'nfs_mapall_user',
    'nfs_mapall_group'
  ];

  constructor(protected router: Router,
              protected entityFormService: EntityFormService,
              protected route: ActivatedRoute,
              protected userService: UserService ) {}

  preInit(EntityForm: any) {
    this.arrayControl =
      _.find(this.fieldConfig, {'name' : 'nfs_paths'});
    this.route.params.subscribe(params => {
      if(params['pk']) {
         this.arrayControl.initialCount = this.initialCount = this.initialCount_default = 0;
      }
    });
  }

  afterInit(EntityForm: any) {
    this.formArray = EntityForm.formGroup.controls['nfs_paths'];

    this.userService.listUsers().subscribe(res => {
      let users = [];
      for (let user of res.data) {
        users.push({label: user['bsdusr_username'], value: user['bsdusr_username']});
      }
      this.nfs_mapall_user = _.find(this.fieldConfig, {'name' : 'nfs_mapall_user'});
      this.nfs_mapall_user.options = users;
      this.nfs_maproot_user = _.find(this.fieldConfig, {'name' : 'nfs_maproot_user'});
      this.nfs_maproot_user.options = users;
    });

    this.userService.listGroups().subscribe(res => {
      let groups = [];
      for (let group of res.data) {
        groups.push({label: group['bsdgrp_group'], value: group['bsdgrp_group']});
      }
      this.nfs_mapall_group = _.find(this.fieldConfig, {'name' : 'nfs_mapall_group'});
      this.nfs_mapall_group.options = groups;
      this.nfs_maproot_group = _.find(this.fieldConfig, {'name' : 'nfs_maproot_group'});
      this.nfs_maproot_group.options = groups;
    }); 
  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    if (actionId == 'remove_path' && this.initialCount <= this.initialCount_default) {
      return false;
    }
    return true;
  }

  preHandler(data: any[]): any[] {
    let paths = [];
    for (let i = 0; i < data.length; i++) {
      paths.push({path:data[i]});
    }
    return paths;
  }

  clean(data) {
    let paths = [];
    for (let i = 0; i < data.nfs_paths.length; i++) {
      if(!data.nfs_paths[i]['delete']) {
        paths.push(data.nfs_paths[i]['path']);
      }
    }
    data.nfs_paths = paths;
    return data;
  }
}
