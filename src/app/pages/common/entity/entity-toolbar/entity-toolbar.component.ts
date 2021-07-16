import {
  Component,
  Input,
  OnChanges, SimpleChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { GlobalAction } from 'app/components/common/page-title/page-title.component';
import { CoreEvent } from 'app/interfaces/events';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ToolbarConfig } from './models/control-config.interface';
import { Control } from './models/control.interface';

@UntilDestroy()
@Component({
  selector: 'entity-toolbar',
  templateUrl: './entity-toolbar.component.html',
  styleUrls: ['./entity-toolbar.component.scss'],
})
export class EntityToolbarComponent implements OnChanges, GlobalAction {
  @Input('conf') conf: ToolbarConfig; // ControlConfig[];
  config: any;
  controller$: Subject<Control>;
  values: any;

  constructor(
    protected loader: AppLoaderService,
    public translate: TranslateService,
  ) {
    this.controller$ = new Subject();
  }

  init(): void {
    this.controller$.pipe(untilDestroyed(this)).subscribe((evt: Control) => {
      const clone = Object.assign([], this.values);
      clone[evt.name] = evt.value;
      this.values = clone;
      clone['event_control'] = evt.name;
      this.config.target.next({ name: 'ToolbarChanged', data: clone });
    });

    this.config.target.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'Refresh':
          // The parent can ping toolbar for latest values
          // Useful for getting initial values
          this.config.target.next({ name: 'ToolbarChanged', data: this.values });
          break;
        case 'UpdateControls':
          this.config.controls = evt.data;
          break;
      }
    });

    // Setup Initial Values
    const obj: any = {};
    this.config.controls.forEach((item: any) => {
      obj[item.name] = item.value;
    });
    this.values = obj;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.conf) {
      // Do Stuff
      this.config = changes.conf.currentValue; // For when config is provided via template
      this.init();
    }
  }

  // For when config is provided via JS
  applyConfig(conf: any): void {
    this.config = conf;
    this.init();
  }
}
