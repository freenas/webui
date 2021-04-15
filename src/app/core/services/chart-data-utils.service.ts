import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Observer, Subject } from 'rxjs';

import { Thread } from 'app/core/classes/thread';
import * as moment from 'moment';
import { CoreService, CoreEvent } from './core.service';

export interface ProcessTask {
  responseEvent: string;
  operation: string;
  data: any[];
}

interface TimeData { // This is in WidgetChartComponent as well. Widgets eventually need to be updated to use this instead
  start: number;
  end: number;
  step: number;
  legend?: string;
}

@Injectable()
export class ChartDataUtilsService {
  private debug = false;
  protected runAsWebWorker = false;
  protected worker: Worker;
  thread: Worker;
  protected ready: boolean;

  constructor(protected core: CoreService) {
    // Operations are what will run on the thread
    const operations = (e) => {
      const context: Worker = self as any; // Required so Typescript doesn't complain

      const callback = (data) => {
        context.postMessage({ name: 'TEST FROM THREAD CALLBACK', data });
      };

      context.onmessage = (e: MessageEvent) => {
        const evt: CoreEvent = e.data;
        console.warn(`Thread received message: ${evt.name}`);
        console.warn(evt);
        callback(evt.data);
      };
    };

    // Create the new thread
    const thread = new Thread(core);

    // Give the thread instructions
    thread.operations = operations;

    // Calback for when we receive messages from the thread
    thread.onmessage = (e: MessageEvent) => {
      const evt: CoreEvent = e.data;
      if (this.debug) {
        console.log(`Parent received message:${evt.name}`);
        console.log(evt);
      }
      // console.warn("chart-data-utils")
      this.core.emit(evt);
    };

    // Start up the thread
    thread.start();

    // Test Message
    thread.postMessage({ name: 'TEST FROM SERVICE', data: 'Test Data Placeholder' });

    core.register({ observerClass: this, eventName: 'ReportsHandleSources' }).subscribe((evt: CoreEvent) => {
      thread.postMessage(evt);
    });

    core.register({ observerClass: this, eventName: 'ReportsHandleStats' }).subscribe((evt: CoreEvent) => {
      thread.postMessage(evt);
    });
  }
}
