import {
  Component, Input, OnInit,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { iXAbstractObject } from 'app/core/classes/ix-abstract-object';
import { ControlConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/pages/common/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-multimenu',
  styleUrls: ['toolbar-multimenu.component.scss'],
  templateUrl: 'toolbar-multimenu.component.html',
})
export class ToolbarMultimenuComponent extends iXAbstractObject implements OnInit {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<any>;
  allSelected = false;
  values: any[] = [];
  private selectStates: boolean [] = [];
  constructor(public translate: TranslateService) {
    super();
  }

  ngOnInit(): void {
    this.selectStates.length = this.config.options.length;
    this.selectStates.fill(false);
    if (this.config.value) {
      for (let i = 0; i < this.config.value.length; i++) {
        const option = this.config.value[i];
        if (option) {
          this.values.push(option);
          for (let j = 0; j < this.selectStates.length; j++) {
            if (this.config.options[j].value == option.value) {
              this.selectStates[j] = true;
              break;
            }
          }
        }
      }
    } else {
      this.values.push(this.config.options[0]);
      this.selectStates[0] = true;
    }

    this.updateController();
  }

  onClick(value: any, index: number): void {
    if (this.selectStates[index]) {
      if (this.checkLength()) { this.allSelected = false; }
      const vIndex = this.values.indexOf(value);
      this.values.splice(vIndex, 1);
    } else {
      this.values.push(value);
    }
    this.selectStates[index] = !this.selectStates[index];
    this.updateController();
  }

  updateController(): void {
    this.config.value = this.values;
    const message: Control = { name: this.config.name, value: this.values };
    this.controller.next(message);
  }

  checkLength(): boolean {
    // return true;
    return this.values.length === this.selectStates.length;
  }

  checkAll(): void {
    this.allSelected = this.checkLength();
    if (!this.allSelected) {
      this.selectStates.fill(true);
      this.values = Object.assign([], this.config.options);
    } else {
      this.selectStates.fill(false);
      this.values = [];
    }
    this.updateController();
  }

  isChecked(): boolean {
    return true;
  }
}
