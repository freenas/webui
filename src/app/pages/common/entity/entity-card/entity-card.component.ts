import {
  Component, OnInit, Input, Output, EventEmitter, TemplateRef, AfterViewInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { iXObject } from 'app/core/classes/ix-object';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'entity-card',
  templateUrl: './entity-card.component.html',
  styleUrls: ['./entity-card.component.scss'],
  providers: [DialogService],
})
export class EntityCardComponent extends iXObject implements OnInit, AfterViewInit {
  @Input('conf') conf: any;
  @Input() width: string;
  @Input() height: string;
  @Input() isFlipped = false;
  @Output() editCard: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() front: TemplateRef<void>;
  @Input() back: TemplateRef<void>;
  @Input() lazyLoaded = false;
  actions = false;

  rows: any[] = [];
  columns: any[] = [];
  page = 1;
  itemsPerPage = 10;
  maxSize = 5;
  numPages = 1;
  length = 0;
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };
  protected loaderOpen = false;

  constructor(
    protected ws: WebSocketService,
    protected router: Router,
    private dialog: DialogService,
    protected loader: AppLoaderService,
  ) {
    super();
  }

  ngOnInit(): void {
    if (this.conf.preInit) {
      this.conf.preInit(this);
    }
    // this.getData();
    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
  }

  ngAfterViewInit(): void {
    if (this.conf) {
      this.isFlipped = this.conf.isFlipped;
    } else {
      console.error("Conf doesn't exist!");
    }
  }

  toggle(row: any): void {
    let rpc: string;

    if (row[this.conf.toggleProp] !== this.conf.runnningState) {
      rpc = this.conf.toggleStart;
    } else {
      rpc = this.conf.toggleStop;
    }

    this.ws.call(rpc as ApiMethod, [row.id]).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        row[this.conf.toggleProp] = ServiceStatus.Running;
      } else {
        row[this.conf.toggleProp] = ServiceStatus.Stopped;
      }
    });
  }

  getData(): void {
    const sort: string[] = [];
    let options: any = {};

    for (const i in this.config.sorting.columns) {
      const col = this.config.sorting.columns[i];
      if (col.sort == 'asc') {
        sort.push(col.name);
      } else if (col.sort == 'desc') {
        sort.push('-' + col.name);
      }
    }

    // options = {limit: this.itemsPerPage, offset: offset};
    options = { limit: 0 };
    if (sort.length > 0) {
      options['sort'] = sort.join(',');
    }
  }

  onChangeTable(
    config: any,
    page: any = { page: this.page, itemsPerPage: this.itemsPerPage },
  ): void {
    if (config.filtering) {
      Object.assign(this.config.filtering, config.filtering);
    }
    if (config.sorting) {
      Object.assign(this.config.sorting, config.sorting);
    }
    this.page = page.page;
    this.getData();
  }

  trClass(row: any): string {
    const classes = [];
    classes.push('treegrid-' + row.id);
    if (row._parent) {
      classes.push('treegrid-parent-' + row._parent);
    }
    return classes.join(' ');
  }

  getCardActions(): any[] {
    if (this.conf.cardActions) {
      this.actions = true;
      return this.conf.cardActions;
    }
    this.actions = false;
  }

  getAddActions(): any[] {
    if (this.conf.getAddActions) {
      return this.conf.getAddActions();
    }
    return [];
  }

  rowValue(row: any, attr: any): any {
    if (this.conf.rowValue) {
      return this.conf.rowValue(row, attr);
    }
    return row[attr];
  }

  doAdd(): void {
    this.router.navigate(new Array('/').concat(this.conf.route_add));
  }

  doSave(): void {
    this.toggleFlip();
  }

  doDelete(): void {
    this.dialog.confirm('Delete', 'Delete this item?').pipe(untilDestroyed(this)).subscribe();

    this.toggleFlip();
  }

  toggleFlip(): void {
    this.conf.isFlipped = !this.conf.isFlipped;
  }
}
