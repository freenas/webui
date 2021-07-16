import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { reject } from 'q';
import { Observable } from 'rxjs';
import { SshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService } from './ws.service';

@Injectable()
export class ReplicationService {
  constructor(protected ws: WebSocketService) { }

  getSnapshotTasks(): Observable<PeriodicSnapshotTask[]> {
    return this.ws.call('pool.snapshottask.query');
  }

  genSSHKeypair(): Promise<SshKeyPair> {
    return this.ws.call('keychaincredential.generate_ssh_key_pair').toPromise();
  }

  getRemoteDataset(transport: any, sshCredentials: string, parentComponent: any): Promise<any> {
    const queryParams = [transport];
    if (transport !== 'LOCAL') {
      queryParams.push(sshCredentials);
    }
    return this.ws.call('replication.list_datasets', queryParams).toPromise().then(
      (res) => {
        const nodes = [];
        for (let i = 0; i < res.length; i++) {
          const pathArr = res[i].split('/');
          if (pathArr.length === 1) {
            const node = {
              name: res[i],
              subTitle: pathArr[0],
              hasChildren: false,
              children: [] as any,
            };
            nodes.push(node);
          } else {
            let parent = _.find(nodes, { name: pathArr[0] });
            let j = 1;
            while (_.find(parent.children, { subTitle: pathArr[j] })) {
              parent = _.find(parent.children, { subTitle: pathArr[j++] });
            }
            const node = {
              name: res[i],
              subTitle: pathArr[j],
              hasChildren: false,
              children: [] as any,
            };
            parent.children.push(node);
            parent.hasChildren = true;
          }
        }
        return nodes;
      },
      (err) => {
        new EntityUtils().handleWSError(parentComponent, err, parentComponent.dialogService);
        return reject(err);
      },
    );
  }

  getReplicationTasks(): Observable<ReplicationTask[]> {
    return this.ws.call('replication.query');
  }

  generateEncryptionHexKey(length: number): string {
    const characters = '0123456789abcdef';
    let res = '';
    for (let i = 0; i < length; i++) {
      res += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return res;
  }
}
