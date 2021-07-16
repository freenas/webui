import {
  Component, Input, Output, EventEmitter,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { iXObject } from 'app/core/classes/ix-object';
import { CoreServiceInjector } from 'app/core/services/core-service-injector';
import { CoreService } from 'app/core/services/core-service/core.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { T } from 'app/translate-marker';

@Component({
  selector: 'widget',
  templateUrl: './widget.component.html',
})
export class WidgetComponent extends iXObject {
  protected core: CoreService;
  themeService: ThemeService;
  @Input() widgetSize: string;
  @Input() rendered?: boolean = true;
  @Input() configurable = false;
  @Output() back = new EventEmitter();
  title: string = T('Widget Base Class');
  chartSize: number;

  // public configurable: boolean = true;
  flipAnimation = 'stop';
  flipDirection = 'vertical';
  isFlipped = false;

  constructor(public translate: TranslateService) {
    super();
    this.core = CoreServiceInjector.get(CoreService);
    this.themeService = CoreServiceInjector.get(ThemeService);
  }

  toggleConfig(): void {
    if (this.isFlipped) {
      this.flipAnimation = 'unflip';
    } else {
      this.flipAnimation = 'flip';
    }

    if (this.flipDirection == 'vertical') {
      this.flipAnimation += 'V';
    } else if (this.flipDirection == 'horizontal') {
      this.flipAnimation += 'H';
    }

    this.isFlipped = !this.isFlipped;
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  setPreferences(form: NgForm): void {
  }

  goBack(): void {
    this.back.emit();
  }
}
