import { Component, OnInit, Input, ElementRef, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk';
import { MdPaginator, MdSort, PageEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';

//local libs
import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { EntityUtils } from '../utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from 'app/services';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';


@Component({
  selector: 'entity-group-table',
  templateUrl: './entity-group-table.component.html',
  styleUrls: ['./entity-group-table.component.scss'],
  providers: [DialogService]
})
export class EntityGroupTableComponent extends EntityTableComponent implements OnInit, AfterViewInit {
  

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
  }

  
  @ViewChild('myTable') table: any;
  
  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialog: DialogService, protected loader: AppLoaderService) {
    super(rest, router, ws, _eRef, dialog, loader);
  }


  ngOnInit(): void {
    super.ngOnInit();
  }

  handleData(res): any {

    res = super.handleData(res);
    return res;
  }



  toggleExpandGroup($event, group) {
    console.log('Toggled Expand Group!', group);
    this.table.groupHeader.toggleExpandGroup(group);
    $event.preventDefault();
  }  

  onDetailToggle($event) {
    console.log('Detail Toggled', $event);
    $event.preventDefault();
  }


  protected setPaginationInfo() {
        this.seenRows = this.currentRows;
  }
    

  
}
