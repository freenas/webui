import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import * as _ from 'lodash';
import { LocaleService } from 'app/services/locale.service';
import { WebSocketService, StorageService, DialogService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'certificate-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class CertificateListComponent {
  title = 'Certificates';
  protected queryCall = 'certificate.query';
  protected wsDelete = 'certificate.delete';
  protected route_add: string[] = ['system', 'certificates', 'add'];
  protected route_add_tooltip: string = helptext_system_certificates.list.tooltip_add;
  protected route_success: string[] = ['system', 'certificates'];

  protected entityList: any;

  columns: any[] = [
    { name: helptext_system_certificates.list.column_name, prop: 'name', always_display: true },
    { name: helptext_system_certificates.list.column_issuer, prop: 'issuer' },
    { name: helptext_system_certificates.list.column_distinguished_name, prop: 'DN' },
    { name: helptext_system_certificates.list.column_from, prop: 'from' },
    { name: helptext_system_certificates.list.column_until, prop: 'until' },
  ];

  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Certificate',
      key_props: ['name'],
    },
  };

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected ws: WebSocketService, public storage: StorageService,
    public dialog: DialogService, public http: HttpClient, protected localeService: LocaleService) {
  }

  resourceTransformIncomingRestData(data) {
    data.forEach((i) => {
      i.from ? i.from = this.localeService.formatDateTime(Date.parse(i.from)) : i.from = 'N/A';
      i.until ? i.until = this.localeService.formatDateTime(Date.parse(i.until)) : i.until = 'N/A';
    });
    return data;
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      if (_.isObject(entityList.rows[i].issuer)) {
        entityList.rows[i].issuer = entityList.rows[i].issuer.name;
      }
    }
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'export_certificate' && row.CSR !== null) {
      return false;
    } if (actionId === 'export_private_key' && row.CSR !== null) {
      return false;
    } if (actionId === 'create_acme_certificate' && row.CSR === null) {
      return false;
    }

    return true;
  }

  getActions(row) {
    return [{
      id: 'View',
      label: helptext_system_certificates.list.action_view,
      onClick: (row) => {
        this.router.navigate(new Array('').concat(['system', 'certificates', 'view', row.id]));
      },
    },
    {
      id: 'export_certificate',
      label: helptext_system_certificates.list.action_export_certificate,
      onClick: (row) => {
        this.ws.call('certificate.query', [[['id', '=', row.id]]]).subscribe((res) => {
          const fileName = `${res[0].name}.crt`;
          if (res[0]) {
            this.ws.call('core.download', ['filesystem.get', [res[0].certificate_path], fileName]).subscribe(
              (res) => {
                const url = res[1];
                const mimetype = 'application/x-x509-user-cert';
                this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe((file) => {
                  this.storage.downloadBlob(file, fileName);
                }, (err) => {
                  this.dialog.errorReport(helptext_system_certificates.list.download_error_dialog.title,
                    helptext_system_certificates.list.download_error_dialog.cert_message, `${err.status} - ${err.statusText}`);
                });
              },
              (err) => {
                new EntityUtils().handleWSError(this, err, this.dialog);
              },
            );
          }
        });
      },
    },
    {
      id: 'export_private_key',
      label: helptext_system_certificates.list.action_export_private_key,
      onClick: (row) => {
        this.ws.call('certificate.query', [[['id', '=', row.id]]]).subscribe((res) => {
          const fileName = `${res[0].name}.key`;
          if (res[0]) {
            this.ws.call('core.download', ['filesystem.get', [res[0].privatekey_path], fileName]).subscribe(
              (res) => {
                const url = res[1];
                const mimetype = 'text/plain';
                this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe((file) => {
                  this.storage.downloadBlob(file, fileName);
                }, (err) => {
                  this.dialog.errorReport(helptext_system_certificates.list.download_error_dialog.title,
                    helptext_system_certificates.list.download_error_dialog.key_message, `${err.status} - ${err.statusText}`);
                });
              },
              (err) => {
                new EntityUtils().handleWSError(this, err, this.dialog);
              },
            );
          }
        });
      },
    },
    {
      id: 'create_acme_certificate',
      label: helptext_system_certificates.list.action_create_acme_certificate,
      onClick: (row) => {
        this.router.navigate(new Array('').concat(['system', 'certificates', 'addacme', row.id]));
      },
    },
    {
      id: 'delete',
      label: helptext_system_certificates.list.action_delete,
      onClick: (row) => {
        this.entityList.doDeleteJob(row).subscribe(
          (progress) => {
            if (progress.state && progress.state === 'FAILED') {
              new EntityUtils().handleWSError(this.entityList, progress, this.dialog);
            }
          },
          (err) => {
            new EntityUtils().handleWSError(this.entityList, err, this.dialog);
          },
          () => {
            this.entityList.getData();
          },
        );
      },
    }];
  }

  wsDeleteParams(row, id) {
    return [id, true]; // send ture value for force delete
  }
}
