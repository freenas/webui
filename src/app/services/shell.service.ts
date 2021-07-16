import {
  Injectable, EventEmitter, Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorage } from 'ngx-webstorage';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ShellConnectedEvent } from '../interfaces/shell.interface';

@Injectable()
export class ShellService {
  onCloseSubject$: Subject<true> ;
  onOpenSubject$: Subject<true> ;
  pendingCalls: any;
  pendingMessages: any[] = [];
  socket: WebSocket;
  connected = false;
  loggedIn = false;
  @LocalStorage() username: string;
  @LocalStorage() password: string;
  redirectUrl = '';
  token: string;
  vmId: number;
  podInfo: any;

  // input and output and eventEmmitter
  private shellCmdOutput: any;
  @Output() shellOutput = new EventEmitter < any >();
  @Output() shellConnected = new EventEmitter<ShellConnectedEvent>();

  subscriptions = new Map <string, any[]>();

  constructor(private _router: Router) {
    this.onOpenSubject$ = new Subject();
    this.onCloseSubject$ = new Subject();
    this.pendingCalls = new Map();
  }

  connect(): void {
    this.socket = new WebSocket(
      (window.location.protocol === 'https:' ? 'wss://' : 'ws://')
      + environment.remote + '/websocket/shell/',
    );
    this.socket.onmessage = this.onmessage.bind(this);
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onclose = this.onclose.bind(this);
  }

  onopen(): void {
    this.onOpenSubject$.next(true);
    if (this.vmId) {
      this.send(JSON.stringify({ token: this.token, options: { vm_id: this.vmId } }));
    } else if (this.podInfo) {
      this.send(JSON.stringify({
        token: this.token,
        options: {
          chart_release_name: this.podInfo.chart_release_name,
          pod_name: this.podInfo.pod_name,
          container_name: this.podInfo.container_name,
          command: this.podInfo.command,
        },
      }));
    } else {
      this.send(JSON.stringify({ token: this.token }));
    }
  }

  onconnect(): void {
    while (this.pendingMessages.length > 0) {
      const payload = this.pendingMessages.pop();
      this.send(payload);
    }
  }

  // empty eventListener for attach socket
  addEventListener(): void {}

  onclose(): void {
    this.connected = false;
    this.onCloseSubject$.next(true);
    this.shellConnected.emit({
      connected: this.connected,
    });
  }

  onmessage(msg: any): void {
    let data: any;

    try {
      data = JSON.parse(msg.data);
    } catch (e) {
      data = { msg: 'please discard this' };
    }

    if (data.msg === 'connected') {
      this.connected = true;
      this.onconnect();
      this.shellConnected.emit({
        connected: this.connected,
        id: data.id,
      });
      return;
    }

    if (!this.connected || data.msg === 'ping') {
      return;
    }

    this.shellCmdOutput = msg.data;
    this.shellOutput.emit(this.shellCmdOutput);
  }

  send(payload: any): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payload);
    } else {
      this.pendingMessages.push(payload);
    }
  }

  subscribe(name: string): Observable < any > {
    const source = Observable.create((observer: any) => {
      if (this.subscriptions.has(name)) {
        this.subscriptions.get(name).push(observer);
      } else {
        this.subscriptions.set(name, [observer]);
      }
    });
    return source;
  }

  unsubscribe(observer: any): void {
    // FIXME: just does not have a good performance :)
    this.subscriptions.forEach((v) => {
      v.forEach((item) => {
        if (item === observer) {
          v.splice(v.indexOf(item), 1);
        }
      });
    });
  }
}
