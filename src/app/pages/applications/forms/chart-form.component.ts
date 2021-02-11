import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService } from '../../../services/index';
import { ApplicationsService } from '../applications.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { CommonUtils } from 'app/core/classes/common-utils';
import  helptext  from '../../../helptext/apps/apps';
import { EntityUtils, FORM_KEY_SEPERATOR, FORM_LABEL_KEY_PREFIX } from '../../common/entity/utils';

@Component({
  selector: 'chart-form',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class ChartFormComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected customFilter: any[];
  protected addCall: string = 'chart.release.create';
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;
  protected utils: CommonUtils;

  private title;
  private name: string;
  private getRow = new Subscription;
  private rowName: string;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [];
  private catalogApp: any;

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService) {

      this.getRow = this.modalService.getRow$.subscribe((rowName: string) => {
        this.rowName = rowName;
        this.customFilter = [[["id", "=", rowName]], {extra: {include_chart_schema: true}}];
        this.getRow.unsubscribe();
    })
    this.utils = new CommonUtils();
  }

  createRelations(relations, parentName) {
    const result = relations.map(relation => {
      let relationFieldName = relation[0];
      if (parentName) {
        relationFieldName = `${parentName}${FORM_KEY_SEPERATOR}${relationFieldName}`;
      }
  
      return {
        action: 'SHOW',
        when: [{
          name: relationFieldName,
          operator: relation[1],
          value: relation[2],
        }]
      };
    });

    return result;    
  }

  parseSchemaFieldConfig(schemaConfig, parentName=null, parentIsList=false) {
    let results = [];

    if (schemaConfig.schema.hidden) {
      return results;
    }

    let name = schemaConfig.variable;
    if (!parentIsList && parentName) {
      name = `${parentName}${FORM_KEY_SEPERATOR}${name}`;
    }

    let fieldConfig = {
      required: schemaConfig.schema.required,
      value: schemaConfig.schema.default,
      tooltip: schemaConfig.description,
      placeholder: schemaConfig.label,
      name: name,
    }
    
    if (schemaConfig.schema.editable === false) {
      fieldConfig['readonly'] = true;
    }

    if (schemaConfig.schema.enum) {
      fieldConfig['type'] = 'select';
      fieldConfig['options'] = schemaConfig.schema.enum.map(option => {
        return {
          value: option.value,
          label: option.description,
        }
      });

    } else if (schemaConfig.schema.type == 'string') {
      fieldConfig['type'] = 'input';
        if (schemaConfig.schema.private) {
          fieldConfig['inputType'] = 'password';
          fieldConfig['togglePw'] = true;
        }

        if (schemaConfig.schema.min_length !== undefined) {
          fieldConfig['min'] = schemaConfig.schema.min_length;
        }

        if (schemaConfig.schema.max_length !== undefined) {
          fieldConfig['max'] = schemaConfig.schema.max_length;
        }

    } else if (schemaConfig.schema.type == 'int') {
      fieldConfig['type'] = 'input';
      fieldConfig['inputType'] = 'number';
      
    } else if (schemaConfig.schema.type == 'boolean') {
      fieldConfig['type'] = 'checkbox';

    } else if (schemaConfig.schema.type == 'hostpath') {
      fieldConfig['type'] = 'explorer';
      fieldConfig['explorerType'] = 'file';
      fieldConfig['initial'] = '/mnt';

    } else if (schemaConfig.schema.type == 'path') {
      fieldConfig['type'] = 'input';

    } else if (schemaConfig.schema.type == 'list') {

      fieldConfig['type'] = 'list';
      fieldConfig['label'] = `${helptext.configure} ${schemaConfig.label}`;
      fieldConfig['width'] = '100%';
      fieldConfig['listFields'] = [];

      let listFields = [];
      schemaConfig.schema.items.forEach(item => {
        const fields = this.parseSchemaFieldConfig(item, null, true);
        listFields = listFields.concat(fields);
      });

      fieldConfig['templateListField'] = listFields;

    } else if (schemaConfig.schema.type == 'dict') {
      fieldConfig = null;
      
      if (schemaConfig.schema.attrs.length > 0) {
        const dictLabel = {
          label: schemaConfig.label,
          name: FORM_LABEL_KEY_PREFIX + name,
          type: 'label',
        };

        if (schemaConfig.schema.show_if) {
          dictLabel['relation'] = this.createRelations(schemaConfig.schema.show_if, parentName);
        }

        results = results.concat(dictLabel);
      }

      schemaConfig.schema.attrs.forEach(dictConfig => {
        const subResults = this.parseSchemaFieldConfig(dictConfig, name, parentIsList);

        if (schemaConfig.schema.show_if) {
          subResults.forEach(subResult => {
            subResult['relation'] = this.createRelations(schemaConfig.schema.show_if, parentName);
          });
        }
        results = results.concat(subResults);
      });
    }

    if (fieldConfig) {

      if (fieldConfig['type']) {

        if (schemaConfig.schema.show_if) {
          fieldConfig['relation'] = this.createRelations(schemaConfig.schema.show_if, parentName);
        }

        results.push(fieldConfig);
  
        if (schemaConfig.schema.subquestions) {
          schemaConfig.schema.subquestions.forEach(subquestion => {
    
            const subResults = this.parseSchemaFieldConfig(subquestion, parentName);
    
            if (schemaConfig.schema.show_subquestions_if !== undefined) {
              subResults.forEach(subFieldConfig => {
                subFieldConfig['isHidden'] = true;
                subFieldConfig['relation'] = [{
                  action: 'SHOW',
                  when: [{
                    name: name,
                    value: schemaConfig.schema.show_subquestions_if,
                  }]
                }];
              });
            }
    
            results = results.concat(subResults);
          });
        }  
      } else {
        console.error("Unsupported type=", schemaConfig);
      }
    }

    return results;
  }

  setTitle(title) {
    this.title = title;
  }
  
  parseSchema(catalogApp, isEdit=false) {
    try {
      this.catalogApp = catalogApp;
      this.title = this.catalogApp.name; 
  
      this.fieldSets = [
        {
          name: helptext.chartForm.release_name.name,
          width: '100%',
          config: [
            {
              type: 'input',
              name: 'release_name',
              placeholder: helptext.chartForm.release_name.placeholder,
              tooltip: helptext.chartForm.release_name.tooltip,
              required: true,
              readonly: isEdit,
            }
          ],
          colspan: 2
        },
      ];
      this.catalogApp.schema.groups.forEach(group => {
        this.fieldSets.push({
          name: group.name,
          label: true,
          config: [],
          colspan: 2
        })
      });
      this.catalogApp.schema.questions.forEach(question => {
        const fieldSet = this.fieldSets.find(fieldSet => fieldSet.name == question.group);
        if (fieldSet) {
          const fieldConfigs = this.parseSchemaFieldConfig(question);
          fieldSet.config = fieldSet.config.concat(fieldConfigs);
        }
      });
  
      this.fieldSets = this.fieldSets.filter(fieldSet => fieldSet.config.length > 0);
      
    } catch(error) {
      return this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  parseConfigData(configData, parentKey, result) {
    Object.keys(configData).forEach(key => {
      const value = configData[key];
      let fullKey = key;
      if (parentKey) {
        fullKey = `${parentKey}${FORM_KEY_SEPERATOR}${key}`;
      }
      if (!Array.isArray(value) && (value != null && typeof value === 'object')) {
        this.parseConfigData(value, fullKey, result);
      } else {
        result[fullKey] = value;
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    const chartSchema = {
      name: data.chart_metadata.name,
      catalog: {
        id: null,
        label: data.catalog,
      },
      schema: data.chart_schema.schema,
    }

    this.parseSchema(chartSchema, true);
    this.name = data.name;
    const configData = {};
    this.parseConfigData(data.config, null, configData);
    configData['release_name'] = data.name;
    configData['changed_schema'] = true;
    
    return configData;
  }

  afterInit(entityEdit: any) {
    if (this.rowName) {
      entityEdit.setDisabled('release_name', true, false);
    }

    let repositoryConfig = _.find(this.fieldConfig, {'name': 'image_repository'});
    if (repositoryConfig) {
      repositoryConfig.readonly = true;
    }
  }

  customSubmit(data) {
    let apiCall = this.addCall;
    let values = {};
    new EntityUtils().parseFormControlValues(data, values);

    let payload = [];
    payload.push({
      catalog: this.catalogApp.catalog.id,
      item: this.catalogApp.name,
      release_name: data.release_name,
      train: 'charts',
      version: 'latest',
      values: values
    });

    if (this.rowName) {
      delete payload[0].catalog;
      delete payload[0].item;
      delete payload[0].release_name;
      delete payload[0].train;
      delete payload[0].version;
      payload.unshift(this.name);
      apiCall = this.editCall;
    }

    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.installing) }, disableClose: true});
    this.dialogRef.componentInstance.setCall(apiCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      // new EntityUtils().handleWSError(this, err, this.dialogService);
    })
  }

}
