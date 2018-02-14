import {Component, ViewContainerRef, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {EntityFormService} from '../../services/entity-form.service';
import {TreeNode, TREE_ACTIONS, KEYS, IActionMapping} from 'angular-tree-component';
import { TranslateService } from 'ng2-translate/ng2-translate';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';


@Component({
  selector : 'form-explorer',
  templateUrl : './form-explorer.component.html',
  styleUrls : [ 
                '../dynamic-field/dynamic-field.css',
                './form-explorer.component.scss'
              ],
})
export class FormExplorerComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  nodes: any[];

  private treeVisible: boolean = false;
  private displayFieldName: string;
  private actionMapping:IActionMapping = {
    mouse: {
      contextMenu: (tree, node, $event) => {
        $event.preventDefault();
      },
      dblClick: (tree, node, $event) => {
        TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
      },
      click: (tree, node, $event) => {
        this.setPath(node);
        TREE_ACTIONS.TOGGLE_SELECTED(tree, node, $event)
      }
    },
    keys: {
      [KEYS.ENTER]: (tree, node, $event) => alert('This is ${node.data.mountpoint}')
    }
  }

  constructor (private entityFormService: EntityFormService,
               public translate: TranslateService){}

  ngOnInit() {
    if(this.config.explorerType === "zvol") {
      this.displayFieldName = 'name';
      this.nodes = [{
        mountpoint: this.config.initial,
        name: this.config.initial,
        hasChildren: true
      }];
    }
    else {
      this.displayFieldName = 'subTitle';
      this.nodes = [{
        name: this.config.initial,
        subTitle: this.config.initial,
        hasChildren: true
      }];
    }
  }

  getChildren(node:any) {
    return new Promise((resolve, reject) => {
      if(this.config.explorerType === "zvol") {
        resolve(this.entityFormService.getDatasetsAndZvolsListChildren(node));
      }
      else if(this.config.explorerType === "directory") {
        resolve(this.entityFormService.getFilesystemListdirChildren(node, this.config.explorerType));
      }
      else if(this.config.explorerType === "file") {
        resolve(this.entityFormService.getFilesystemListdirChildren(node));
      }
      else {
        resolve(this.entityFormService.getFilesystemListdirChildren(node));
      }     
    });
  }

  customTemplateStringOptions = {
    displayField: this.displayFieldName,
    isExpandedField: 'expanded',
    idField: 'uuid',
    getChildren: this.getChildren.bind(this),
    actionMapping: this.actionMapping,
    nodeHeight: 23,
    allowDrag: true,
    useVirtualScroll: false
  }
  
  private toggleTree() {
    this.treeVisible = !this.treeVisible;
  }

  setPath(node:any) {
    if(this.config.explorerType === "zvol") {
      if(!node.data.mountpoint) {
        node.data.mountpoint = this.config.initial + "/" + node.data.path;
      }
      this.group.controls[this.config.name].setValue(node.data.mountpoint);
    }
    else {
      this.group.controls[this.config.name].setValue(node.data.name);
    }
  }
}


