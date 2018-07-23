import { Component, OnInit, AfterViewInit, Input, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { CoreServiceInjector } from '../../../services/coreserviceinjector';
import { Router } from '@angular/router';
import { CoreService, CoreEvent } from '../../../services/core.service';
import { MaterialModule } from '../../../../appMaterial.module';
import { ChartData } from '../../viewchart/viewchart.component';
import { ViewChartDonutComponent } from '../../viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from '../../viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from '../../viewchartline/viewchartline.component';
import { AnimationDirective } from '../../../directives/animation.directive';
import filesize from 'filesize';
import { WidgetComponent } from '../widget/widget.component';
import { environment } from 'environments/environment';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-sysinfo',
  templateUrl:'./widgetsysinfo.component.html',
  styleUrls: ['./widgetsysinfo.component.css']
})
export class WidgetSysInfoComponent extends WidgetComponent implements OnInit, AfterViewInit {
  public title: string = T("System Info");
  public data: any;
  public memory:string;
  public imagePath:string = "assets/images/";
  public cardBg:string = "";
  public updateAvailable:boolean = false;
  private _updateBtnStatus:string = "default";
  public updateBtnLabel:string = T("Check for Updates")
  private _themeAccentColors: string[];
  public connectionIp = environment.remote
  public manufacturer:string = '';
  public buildDate:string;
  public loader:boolean = false;

  constructor(public router: Router, public translate: TranslateService){
    super(translate);
    this.configurable = false;
  }

  ngAfterViewInit(){
    this.core.register({observerClass:this,eventName:"SysInfo"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("******** SysInfo ********");
      //DEBUG: console.log(evt.data);
      this.loader = false;
      this.data = evt.data;

      let build = new Date(this.data.buildtime[0]['$date']);
      let year = build.getUTCFullYear();
      let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",]
      let month = months[build.getUTCMonth()];
      let day = build.getUTCDate();
      let hours = build.getUTCHours();
      let minutes = build.getUTCMinutes();
      this.buildDate = month + " " +  day + ", " + year + " " + hours + ":" + minutes;

      this.memory = this.formatMemory(this.data.physmem, "GB");
      if(this.data.system_manufacturer && this.data.system_manufacturer.toLowerCase() == 'ixsystems'){
        this.manufacturer = "ixsystems";
      } else {
        this.manufacturer = "other";
      }

      // Hardware detection
      switch(evt.data.system_product){
        case "FREENAS-MINI-2.0":
          this.cardBg = 'freenas_mini.png';
          //this.cardBg = 'logo.svg';
        break;
        case "FREENAS-MINI-XL":
          this.cardBg = 'freenas_mini_xl.png';
          //this.cardBg = 'logo.svg';
        break;
        default:
          this.cardBg = 'logo.svg';
        break;
      }
    });

    this.core.register({observerClass:this,eventName:"UpdateChecked"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      if(evt.data.status == "AVAILABLE"){
        this.updateAvailable = true;
      }
    });
    this.core.emit({name:"SysInfoRequest"});
    this.core.emit({name:"UpdateCheck"});
  }
  
  ngOnInit(){
  }

  getCardBg(){
    return "url('" + this.imagePath + this.cardBg + "')";
  }

  get themeAccentColors(){
    let theme = this.themeService.currentTheme();
    this._themeAccentColors = [];
    for(let color in theme.accentColors){
      this._themeAccentColors.push(theme[theme.accentColors[color]]);
    }
    return this._themeAccentColors;
  }

  get updateBtnStatus(){
    if(this.updateAvailable){
      this._updateBtnStatus = "default";
      this.updateBtnLabel = T("Updates Available");
    }
    return this._updateBtnStatus;
  }

  formatMemory(physmem:number, units:string){
    let result:string; 
    if(units == "MB"){
      result = Number(physmem / 1024 / 1024).toFixed(0) + ' MB';
    } else if(units == "GB"){
      result = Number(physmem / 1024 / 1024 / 1024).toFixed(0) + ' GB';
    }
    return result;
  }

}
