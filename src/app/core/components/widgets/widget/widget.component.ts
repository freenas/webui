import { Component, AfterViewInit, Input, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CoreServiceInjector } from '../../../services/coreserviceinjector';
import { CoreService, CoreEvent } from '../../../services/core.service';
import { ThemeService } from '../../../../services/theme/theme.service';
import { MaterialModule } from '../../../../appMaterial.module';
import { ChartData } from '../../viewchart/viewchart.component';
import { ViewChartDonutComponent } from '../../viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from '../../viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from '../../viewchartline/viewchartline.component';
import { AnimationDirective } from '../../../directives/animation.directive';
import filesize from 'filesize';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget',
  templateUrl:'./widget.component.html'
})
export class WidgetComponent implements AfterViewInit {

  protected core:CoreService;
  protected themeService: ThemeService;
  @Input() widgetSize: string;
  @Input() configurable:boolean = false;
  public title:string = T("Widget Base Class");
  public chartSize:number;
  //public configurable: boolean = true;
  public flipAnimation = "stop";
  public flipDirection = "vertical";
  public isFlipped: boolean = false;

  constructor(public translate: TranslateService){
    this.core = CoreServiceInjector.get(CoreService);
    this.themeService = CoreServiceInjector.get(ThemeService);
  }

  ngAfterViewInit(){
  }

  toggleConfig(){
    if(this.isFlipped){
      this.flipAnimation = "unflip";
    } else {
      this.flipAnimation = "flip"
    }

    if(this.flipDirection == "vertical"){
      this.flipAnimation += "V";
    } else if(this.flipDirection == "horizontal"){
      this.flipAnimation += "H";
    }

    this.isFlipped = !this.isFlipped;
  }

  setPreferences(form:NgForm){
    console.log("******** FORM SUBMITTED!! ********");
    console.log(form);
  }

}
