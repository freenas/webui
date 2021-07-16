import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { WebSocketService } from 'app/services';
import { BaseService } from './base.service';
import { CoreService } from './core-service/core.service';

@Injectable({
  providedIn: 'root',
})
export class StatsService extends BaseService {
  protected disks: any[] = [];
  protected subscribers = 0;
  protected realtimeEvents: Subscription;
  protected diskQueryEvents: Subscription;

  constructor(protected core: CoreService, protected websocket: WebSocketService) {
    super(core, websocket);
  }

  protected onAuthenticated(): void {
    this.authenticated = true;

    // TODO: use disk.query to detect drive change events
    this.diskQueryEvents = this.websocket.sub('disk.query').subscribe((res) => {
      this.core.emit({ name: 'DiskStateChanged', data: res, sender: this });
    });

    if (this.subscribers > 0 && !this.realtimeEvents) {
      this.realtimeEvents = this.websocket.sub<ReportingRealtimeUpdate>('reporting.realtime').subscribe((update) => {
        this.core.emit({ name: 'RealtimeStats', data: update, sender: this });
      });
    }
  }
}
