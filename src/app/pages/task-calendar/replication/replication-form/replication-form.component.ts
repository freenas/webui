import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/task-calendar/replication/replication';
import { WebSocketService, TaskService, KeychainCredentialService, ReplicationService, StorageService } from 'app/services';
import * as _ from 'lodash';

@Component({
    selector: 'app-replication-list',
    template: `<entity-form [conf]='this'></entity-form>`,
    providers: [TaskService, KeychainCredentialService, ReplicationService, StorageService]
})
export class ReplicationFormComponent {

    protected queryCall = 'replication.query';
    protected queryCallOption: Array<any> = [["id", "="]];
    protected addCall = 'replication.create';
    protected editCall = 'replication.update';
    protected route_success: string[] = ['tasks', 'replication'];
    protected isEntity = true;
    protected entityForm: any;
    protected queryRes: any;
    public speedLimitField: any;

    protected retentionPolicyChoice = [{
        label: 'Same as Source',
        value: 'SOURCE',
    }, {
        label: 'Custom',
        value: 'CUSTOM',
    }, {
        label: 'None',
        value: 'NONE',
    }];

    protected fieldConfig: FieldConfig[] = [
        {
            type: 'input',
            name: 'name',
            placeholder: helptext.name_placeholder,
            tooltip: helptext.name_tooltip,
            required: true,
            validation: [Validators.required]
        },
        {
            type: 'select',
            name: 'direction',
            placeholder: helptext.direction_placeholder,
            tooltip: helptext.direction_tooltip,
            options: [
                {
                    label: 'PUSH',
                    value: 'PUSH',
                }, {
                    label: 'PULL',
                    value: 'PULL',
                }
            ],
            value: 'PUSH',
        }, {
            type: 'select',
            name: 'transport',
            placeholder: helptext.transport_placeholder,
            tooltip: helptext.transport_tooltip,
            options: [
                {
                    label: 'SSH',
                    value: 'SSH',
                }, {
                    label: 'SSH+NETCAT',
                    value: 'SSH+NETCAT',
                }, {
                    label: 'LOCAL',
                    value: 'LOCAL',
                }, {
                    label: 'LEGACY',
                    value: 'LEGACY',
                }
            ],
            value: 'SSH',
        }, {
            type: 'select',
            name: 'ssh_credentials',
            placeholder: helptext.ssh_credentials_placeholder,
            tooltip: helptext.ssh_credentials_tooltip,
            options: [
                {
                    label: '---------',
                    value: '',
                }
            ],
            value: '',
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LOCAL',
                }]
            }],
            required: true,
            validation: [Validators.required],
        }, {
            type: 'select',
            name: 'netcat_active_side',
            placeholder: helptext.netcat_active_side_placeholder,
            tooltip: helptext.netcat_active_side_tooltip,
            options: [
                {
                    label: 'LOCAL',
                    value: 'LOCAL',
                }, {
                    label: 'REMOTE',
                    value: 'REMOTE',
                }
            ],
            value: 'LOCAL',
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        }, {
            type: 'input',
            name: 'netcat_active_side_listen_address',
            placeholder: helptext.netcat_active_side_listen_address_placeholder,
            tooltip: helptext.netcat_active_side_listen_address_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        }, {
            type: 'input',
            name: 'netcat_active_side_port_min',
            placeholder: helptext.netcat_active_side_port_min_placeholder,
            tooltip: helptext.netcat_active_side_port_min_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        }, {
            type: 'input',
            name: 'netcat_active_side_port_max',
            placeholder: helptext.netcat_active_side_port_max_placeholder,
            tooltip: helptext.netcat_active_side_port_max_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        }, {
            type: 'input',
            name: 'netcat_passive_side_connect_address',
            placeholder: helptext.netcat_passive_side_connect_address_placeholder,
            tooltip: helptext.netcat_passive_side_connect_address_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        }, {
            type: 'explorer',
            initial: '',
            explorerType: 'dataset',
            multiple: true,
            tristate: false,
            name: 'source_datasets_PUSH',
            placeholder: helptext.source_datasets_placeholder,
            tooltip: helptext.source_datasets_tooltip,
            options: [],
            required: true,
            validation: [Validators.required],
            isHidden: true,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'direction',
                    value: 'PUSH',
                }]
            }],
        }, {
            type: 'explorer',
            name: 'target_dataset_PUSH',
            placeholder: helptext.target_dataset_placeholder,
            tooltip: helptext.target_dataset_tooltip,
            initial: '',
            explorerType: 'directory',
            customTemplateStringOptions: {
                displayField: 'Path',
                isExpandedField: 'expanded',
                idField: 'uuid',
                getChildren: this.getChildren.bind(this),
                nodeHeight: 23,
                allowDrag: false,
                useVirtualScroll: false,
            },
            required: true,
            validation: [Validators.required],
            isHidden: true,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'direction',
                    value: 'PUSH',
                }]
            }],
        }, {
            type: 'explorer',
            name: 'source_datasets_PULL',
            placeholder: helptext.source_datasets_placeholder,
            tooltip: helptext.source_datasets_placeholder,
            initial: '',
            explorerType: 'directory',
            customTemplateStringOptions: {
                displayField: 'Path',
                isExpandedField: 'expanded',
                idField: 'uuid',
                getChildren: this.getChildren.bind(this),
                nodeHeight: 23,
                allowDrag: false,
                useVirtualScroll: false,
            },
            required: true,
            validation: [Validators.required],
            isHidden: true,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'direction',
                    value: 'PULL',
                }]
            }],
        }, {
            type: 'explorer',
            initial: '',
            explorerType: 'dataset',
            name: 'target_dataset_PULL',
            placeholder: helptext.target_dataset_placeholder,
            tooltip: helptext.target_dataset_placeholder,
            options: [],
            required: true,
            validation: [Validators.required],
            isHidden: true,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'direction',
                    value: 'PULL',
                }]
            }],
        }, {
            type: 'checkbox',
            name: 'recursive',
            placeholder: helptext.recursive_placeholder,
            tooltip: helptext.recursive_tooltip,
            value: false,
        }, {
            type: 'input',
            name: 'exclude',
            placeholder: helptext.exclude_placeholder,
            tooltip: helptext.exclude_tooltip,
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'recursive',
                    value: false,
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'select',
            multiple: true,
            name: 'periodic_snapshot_tasks',
            placeholder: helptext.periodic_snapshot_tasks_placeholder,
            tooltip: helptext.periodic_snapshot_tasks_tooltip,
            options: [],
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'direction',
                    value: 'PULL',
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },
        {
            type: 'input',
            name: 'naming_schema',
            placeholder: helptext.naming_schema_placeholder,
            tooltip: helptext.naming_schema_tooltip,
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'direction',
                    value: 'PUSH',
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },
        {
            type: 'input',
            name: 'also_include_naming_schema',
            placeholder: helptext.also_include_naming_schema_placeholder,
            tooltip: helptext.also_include_naming_schema_tooltip,
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'direction',
                    value: 'PULL',
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },
        {
            type: 'checkbox',
            name: 'auto',
            placeholder: helptext.auto_placeholder,
            tooltip: helptext.auto_tooltip,
            value: true,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'checkbox',
            name: 'schedule',
            placeholder: helptext.schedule_placeholder,
            tooltip: helptext.schedule_tooltip,
            value: null,
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }, {
                    name: 'auto',
                    value: false,
                }]
            }]
        }, {
            type: 'scheduler',
            name: 'schedule_picker',
            tooltip: helptext.schedule_picker_tooltip,
            value: "0 0 * * *",
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'schedule',
                    value: true,
                }]
            }],
        }, {
            type: 'select',
            name: 'schedule_begin',
            placeholder: helptext.schedule_begin_placeholder,
            tooltip: helptext.schedule_begin_tooltip,
            options: [],
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'schedule',
                    value: true,
                }]
            }],
            value: '00:00',
        }, {
            type: 'select',
            name: 'schedule_end',
            placeholder: helptext.schedule_end_placeholder,
            tooltip: helptext.schedule_end_tooltip,
            options: [],
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'schedule',
                    value: true,
                }]
            }],
            value: '23:59',
        }, {
            type: 'checkbox',
            name: 'restrict_schedule',
            placeholder: helptext.restrict_schedule_placeholder,
            tooltip: helptext.restrict_schedule_tooltip,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'scheduler',
            name: 'restrict_schedule_picker',
            tooltip: helptext.restrict_schedule_picker_tooltip,
            value: "0 0 * * *",
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'restrict_schedule',
                    value: true,
                }]
            }],
        }, {
            type: 'select',
            name: 'restrict_schedule_begin',
            placeholder: helptext.restrict_schedule_begin_placeholder,
            tooltip: helptext.restrict_schedule_begin_tooltip,
            options: [],
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'restrict_schedule',
                    value: true,
                }]
            }],
            value: '00:00',
        }, {
            type: 'select',
            name: 'restrict_schedule_end',
            placeholder: helptext.restrict_schedule_end_placeholder,
            tooltip: helptext.restrict_schedule_end_tooltip,
            options: [],
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'restrict_schedule',
                    value: true,
                }]
            }],
            value: '23:59',
        }, {
            type: 'checkbox',
            name: 'only_matching_schedule',
            placeholder: helptext.only_matching_schedule_placeholder,
            tooltip: helptext.only_matching_schedule_tooltip,
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'schedule',
                    value: false,
                }, {
                    name: 'schedule',
                    value: null,
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'checkbox',
            name: 'allow_from_scratch',
            placeholder: helptext.allow_from_scratch_placeholder,
            tooltip: helptext.allow_from_scratch_tooltip,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'checkbox',
            name: 'hold_pending_snapshots',
            placeholder: helptext.hold_pending_snapshots_placeholder,
            tooltip: helptext.hold_pending_snapshots_tooltip,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'select',
            name: 'retention_policy',
            placeholder: helptext.retention_policy_placeholder,
            tooltip: helptext.retention_policy_tooltip,
            options: this.retentionPolicyChoice,
            value: 'NONE',
        }, {
            type: 'input',
            inputType: 'number',
            name: 'lifetime_value',
            placeholder: helptext.lifetime_value_placeholder,
            tooltip: helptext.lifetime_value_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'retention_policy',
                    value: 'CUSTOM',
                }]
            }],
            width: '50%',
        }, {
            type: 'select',
            name: 'lifetime_unit',
            placeholder: helptext.lifetime_unit_placeholder,
            tooltip: helptext.lifetime_unit_tooltip,
            options: [
                {
                    label: 'Hour(s)',
                    value: 'HOUR',
                }, {
                    label: 'Day(s)',
                    value: 'DAY',
                }, {
                    label: 'Week(s)',
                    value: 'WEEK',
                }, {
                    label: 'Month(s)',
                    value: 'MONTH',
                }, {
                    label: 'Year(s)',
                    value: 'YEAR',
                }
            ],
            value: 'WEEK',
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'retention_policy',
                    value: 'CUSTOM',
                }]
            }],
            width: '50%',
        },
        {
            type: 'select',
            name: 'compression',
            placeholder: helptext.compression_placeholder,
            tooltip: helptext.compression_tooltip,
            options: [
                {
                    label: 'Disabled',
                    value: 'DISABLED', // should set it to be null before submit
                }, {
                    label: 'lz4 (fastest)',
                    value: 'LZ4',
                }, {
                    label: 'pigz (all rounder)',
                    value: 'PIGZ',
                }, {
                    label: 'plzip (best compression)',
                    value: 'PLZIP',
                }
            ],
            value: 'DISABLED',
            relation: [{
                action: 'SHOW',
                connective: 'OR',
                when: [{
                    name: 'transport',
                    value: 'SSH',
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'input',
            name: 'speed_limit',
            placeholder: helptext.speed_limit_placeholder,
            tooltip: helptext.speed_limit_tooltip,
            hasErrors: false,
            relation: [{
                action: 'SHOW',
                connective: 'OR',
                when: [{
                    name: 'transport',
                    value: 'SSH',
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
            blurStatus : true,
            blurEvent : this.blurEvent,
            parent : this,
        },
        {
            type: 'checkbox',
            name: 'dedup',
            placeholder: helptext.dedup_placeholder,
            tooltip: helptext.dedup_tooltip,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'checkbox',
            name: 'large_block',
            placeholder: helptext.large_block_placeholder,
            tooltip: helptext.large_block_tooltip,
            value: true,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },
        // {
        //     type: 'checkbox',
        //     name: 'embed',
        //     placeholder: helptext.embed_placeholder,
        //     tooltip: helptext.embed_tooltip,
        //     value: true,
        //     relation: [{
        //         action: 'HIDE',
        //         when: [{
        //             name: 'transport',
        //             value: 'LEGACY',
        //         }]
        //     }],
        // },
        {
            type: 'checkbox',
            name: 'compressed',
            placeholder: helptext.compressed_placeholder,
            tooltip: helptext.compressed_tooltip,
            value: true,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'input',
            inputType: 'number',
            name: 'retries',
            placeholder: helptext.retries_placeholder,
            tooltip: helptext.retries_tooltip,
            value: 5,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'select',
            name: 'logging_level',
            placeholder: helptext.logging_level_placeholder,
            tooltip: helptext.logging_level_tooltip,
            options: [
                {
                    label: 'DEFAULT',
                    value: 'DEFAULT',
                },
                {
                    label: 'DEBUG',
                    value: 'DEBUG',
                }, {
                    label: 'INFO',
                    value: 'INFO',
                }, {
                    label: 'WARNING',
                    value: 'WARNING',
                }, {
                    label: 'ERROR',
                    value: 'ERROR',
                }
            ],
            value: 'DEFAULT',
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        }, {
            type: 'checkbox',
            name: 'enabled',
            placeholder: helptext.enabled_placeholder,
            tooltip: helptext.enabled_tooltip,
            value: true,
        },
    ]

    constructor(
        private ws: WebSocketService,
        protected taskService: TaskService,
        protected storageService: StorageService,
        private aroute: ActivatedRoute,
        private keychainCredentialService: KeychainCredentialService,
        private replicationService: ReplicationService) {
        const sshCredentialsField = _.find(this.fieldConfig, { name: 'ssh_credentials' });
        this.keychainCredentialService.getSSHConnections().subscribe(
            (res) => {
                for (const i in res) {
                    sshCredentialsField.options.push({ label: res[i].name, value: res[i].id });
                }
            }
        )

        const periodicSnapshotTasksField = _.find(this.fieldConfig, { name: 'periodic_snapshot_tasks' });
        this.ws.call('pool.snapshottask.query').subscribe(
            (res) => {
                for (const i in res) {
                    const label = res[i].dataset + ' - ' + res[i].naming_schema + ' - ' + res[i].lifetime_value + ' ' + res[i].lifetime_unit + '(S) - ' + (res[i].enabled ? 'Enabled' : 'Disabled');
                    periodicSnapshotTasksField.options.push({ label: label, value: res[i].id });
                }
            }
        )

        const scheduleBeginField = _.find(this.fieldConfig, { 'name': 'schedule_begin' });
        const restrictScheduleBeginField = _.find(this.fieldConfig, { 'name': 'restrict_schedule_begin' });
        const scheduleEndField = _.find(this.fieldConfig, { 'name': 'schedule_end' });
        const restrictScheduleEndField = _.find(this.fieldConfig, { 'name': 'restrict_schedule_end' });

        const time_options = this.taskService.getTimeOptions();
        for (let i = 0; i < time_options.length; i++) {
            const option = { label: time_options[i].label, value: time_options[i].value };
            scheduleBeginField.options.push(option);
            restrictScheduleBeginField.options.push(option);
            scheduleEndField.options.push(option);
            restrictScheduleEndField.options.push(option);
        }

    }

    preInit() {
        this.aroute.params.subscribe(params => {
            if (params['pk']) {
                this.queryCallOption[0].push(parseInt(params['pk']));
            }
        });
    }

    afterInit(entityForm) {
        this.entityForm = entityForm;
        if (this.entityForm.formGroup.controls['speed_limit'].value) {
            let presetSpeed = (this.entityForm.formGroup.controls['speed_limit'].value).toString();
            this.storageService.humanReadable = presetSpeed;
        }
        
        const retentionPolicyField = _.find(this.fieldConfig, {name: 'retention_policy'});
        entityForm.formGroup.controls['transport'].valueChanges.subscribe(
            (res) => {
                if (res !== 'LEGACY' && retentionPolicyField.options !== this.retentionPolicyChoice) {
                    retentionPolicyField.options = this.retentionPolicyChoice;
                } else if (res === 'LEGACY') {
                    const options = [...this.retentionPolicyChoice];
                    options.splice(1, 1);
                    retentionPolicyField.options = options;
                    if (entityForm.formGroup.controls['retention_policy'].value === 'CUSTOM') {
                        entityForm.formGroup.controls['retention_policy'].setValue('NONE');
                    }
                }
            }
        )

        entityForm.formGroup.controls['periodic_snapshot_tasks'].valueChanges.subscribe(
            (res) => {
                if (entityForm.formGroup.controls['transport'].value !== 'LEGACY') {
                    const toDisable = (res && res.length === 0) ? false : true;
                    entityForm.setDisabled('schedule', toDisable, toDisable);
                }
            }
        )

        entityForm.formGroup.controls['schedule'].statusChanges.subscribe((res) => {
            const toDisable = res === 'DISABLED' ? true : false;
            if (entityForm.formGroup.controls['schedule'].value) {
                entityForm.setDisabled('schedule_picker', toDisable, toDisable);
                entityForm.setDisabled('schedule_begin', toDisable, toDisable);
                entityForm.setDisabled('schedule_end', toDisable, toDisable);
            }
        })

        entityForm.formGroup.controls['ssh_credentials'].valueChanges.subscribe(
            (res) => {
                for (const item of ['target_dataset_PUSH', 'source_datasets_PULL']) {
                    const explorerComponent = _.find(this.fieldConfig, {name: item}).customTemplateStringOptions.explorerComponent;
                    explorerComponent.nodes = [{
                        mountpoint: explorerComponent.config.initial,
                        name: explorerComponent.config.initial,
                        hasChildren: true
                    }];
                }
            }
        )

        entityForm.formGroup.controls['speed_limit'].valueChanges.subscribe((value) => {
            const speedLimitField = _.find(this.fieldConfig, {name: "speed_limit"});
            const filteredValue = this.storageService.convertHumanStringToNum(value);
            speedLimitField['hasErrors'] = false;
            speedLimitField['errors'] = '';
                if (isNaN(filteredValue)) {
                    speedLimitField['hasErrors'] = true;
                    speedLimitField['errors'] = helptext.speed_limit_errors;
                };
        });
    }

    resourceTransformIncomingRestData(wsResponse) {
        this.queryRes = _.cloneDeep(wsResponse);
        wsResponse['source_datasets_PUSH'] = wsResponse['source_datasets'];
        wsResponse['target_dataset_PUSH'] = wsResponse['target_dataset'];
        wsResponse['source_datasets_PULL'] = wsResponse['source_datasets'];
        wsResponse['target_dataset_PULL'] = wsResponse['target_dataset'];

        if (wsResponse['ssh_credentials']) {
            wsResponse['ssh_credentials'] = wsResponse['ssh_credentials'].id;
        }

        wsResponse['compression'] = wsResponse['compression'] === null ? 'DISABLED' : wsResponse['compression'];
        wsResponse['logging_level'] = wsResponse['logging_level'] === null ? 'DEFAULT' : wsResponse['logging_level'];
        const snapshotTasks = [];
        for (const item of wsResponse['periodic_snapshot_tasks']) {
            snapshotTasks.push(item.id);
        }
        wsResponse['periodic_snapshot_tasks'] = snapshotTasks;

        if (wsResponse.schedule) {
            wsResponse['schedule_picker'] = "0" + " " +
                wsResponse.schedule.hour + " " +
                wsResponse.schedule.dom + " " +
                wsResponse.schedule.month + " " +
                wsResponse.schedule.dow;
            wsResponse['schedule_begin'] = wsResponse.schedule.begin;
            wsResponse['schedule_end'] = wsResponse.schedule.end;
            wsResponse['schedule'] = true;
        }

        if (wsResponse.restrict_schedule) {
            wsResponse['restrict_schedule_picker'] = "0" + " " +
                wsResponse.restrict_schedule.hour + " " +
                wsResponse.restrict_schedule.dom + " " +
                wsResponse.restrict_schedule.month + " " +
                wsResponse.restrict_schedule.dow;
            wsResponse['restrict_schedule_begin'] = wsResponse.restrict_schedule.begin;
            wsResponse['restrict_schedule_end'] = wsResponse.restrict_schedule.end;
            wsResponse['restrict_schedule'] = true;
        }
        return wsResponse;
    }

    parsePickerTime(picker, begin, end) {
        const spl = picker.split(" ");
        return {
            minute: spl[0],
            hour: spl[1],
            dom: spl[2],
            month: spl[3],
            dow: spl[4],
            begin: begin,
            end: end,
        };
    }

    beforeSubmit(data) {
        data['speed_limit'] = this.storageService.convertHumanStringToNum(data['speed_limit']);
        if (data['direction'] == 'PUSH') {
            for (let i = 0; i < data['source_datasets_PUSH'].length; i++) {
                if (_.startsWith(data['source_datasets_PUSH'][i], '/mnt/')) {
                    data['source_datasets_PUSH'][i] = data['source_datasets_PUSH'][i].substring(5);
                }
            }
            data['source_datasets'] = Array.isArray(data['source_datasets_PUSH']) ? _.cloneDeep(data['source_datasets_PUSH']) : _.cloneDeep(data['source_datasets_PUSH']).split(' ');
            data['target_dataset'] = typeof data['target_dataset_PUSH'] === 'string' ? _.cloneDeep(data['target_dataset_PUSH']) : _.cloneDeep(data['target_dataset_PUSH']).toString();

            delete data['source_datasets_PUSH'];
            delete data['target_dataset_PUSH'];
        } else {
            data['source_datasets'] = Array.isArray(data['source_datasets_PULL']) ? _.cloneDeep(data['source_datasets_PULL']) : _.cloneDeep(data['source_datasets_PULL']).split(' ');
            data['target_dataset'] = typeof data['target_dataset_PULL'] === 'string' ? _.cloneDeep(data['target_dataset_PULL']) : _.cloneDeep(data['target_dataset_PULL']).toString();
            if (_.startsWith(data['target_dataset'], '/mnt/')) {
                data['target_dataset']  =  data['target_dataset'] .substring(5);
            }
            delete data['source_datasets_PULL'];
            delete data['target_dataset_PULL'];
        }

        data["exclude"] = typeof data['exclude'] === "string" ? data['exclude'].split(' ') : data['exclude'];
        data["periodic_snapshot_tasks"] = typeof data['periodic_snapshot_tasks'] === "string" ? data['periodic_snapshot_tasks'].split(' ') : data['periodic_snapshot_tasks'];
        data["naming_schema"] = typeof data['naming_schema'] === "string" ? data['naming_schema'].split(' ') : data['naming_schema'];
        data["also_include_naming_schema"] = typeof data['also_include_naming_schema'] === "string" ? data['also_include_naming_schema'].split(' ') : data['also_include_naming_schema'];

        if (data['schedule']) {
            data['schedule'] = this.parsePickerTime(data['schedule_picker'], data['schedule_begin'], data['schedule_end']);
            delete data['schedule_picker'];
            delete data['schedule_begin'];
            delete data['schedule_end'];
        }
        if (data['restrict_schedule']) {
            data['restrict_schedule'] = this.parsePickerTime(data['restrict_schedule_picker'], data['restrict_schedule_begin'], data['restrict_schedule_end']);
            delete data['restrict_schedule_picker'];
            delete data['restrict_schedule_begin'];
            delete data['restrict_schedule_end'];
        }

        if (data['compression'] === 'DISABLED') {
            delete data['compression'];
        }
        if (data['logging_level'] === 'DEFAULT') {
            delete data['logging_level'];
        }

        if (data["transport"] === "LEGACY") {
            data["auto"] = true;
            data["retention_policy"] = "NONE";
            data["allow_from_scratch"] = true;
            data["exclude"] = [];
            data["periodic_snapshot_tasks"] = [];
            data["naming_schema"] = [];
            data["also_include_naming_schema"] = [];
            data["only_matching_schedule"] = false;
            data["dedup"] = false;
            data["large_block"] = false;
            data["embed"] = false;
            data["compressed"] = false;
            data["retries"] = 1
        }
        // for edit replication task
        if (!this.entityForm.isNew) {
            if (data["transport"] === "LOCAL") {
                data['ssh_credentials'] = null;
            }

            for (const prop in this.queryRes) {
                if (prop === 'only_matching_schedule' || prop === 'hold_pending_snapshots') {
                    data[prop] = false;
                }
                if (prop !== 'id' && prop !== 'state' && data[prop] === undefined) {
                    data[prop] = Array.isArray(this.queryRes[prop]) ? [] : null;
                }
            }
        }
    }

    getChildren(node) {
        for (const item of ['target_dataset_PUSH', 'source_datasets_PULL']) {
            _.find(this.fieldConfig, {name: 'target_dataset_PUSH'}).hasErrors = false;
        }

        const transport = this.entityForm.formGroup.controls['transport'].value;
        const sshCredentials = this.entityForm.formGroup.controls['ssh_credentials'].value;
        if (sshCredentials == undefined || sshCredentials == '') {
            for (const item of ['target_dataset_PUSH', 'source_datasets_PULL']) {
                _.find(this.fieldConfig, {name: item}).hasErrors = true;
                _.find(this.fieldConfig, {name: item}).errors = 'Please select a valid SSH Connection';
            }
            return;
        }

        return new Promise((resolve, reject) => {
            resolve(this.replicationService.getRemoteDataset(transport,sshCredentials, this));
        });
    }

    blurEvent(parent){
        if (parent.entityForm) {
            parent.entityForm.formGroup.controls['speed_limit'].setValue(parent.storageService.humanReadable)
        }
    }
}
