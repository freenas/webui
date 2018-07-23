import { Component, OnInit } from '@angular/core';
import { ViewChartComponent, ViewChartMetadata } from '../viewchart/viewchart.component';
//import * as c3 from 'c3';

@Component({
  selector: 'viewchartdonut',
  template:ViewChartMetadata.template
  //templateUrl: './viewchartpie.component.html',
  //styleUrls: ['./viewchartdonut.component.css']
  })
export class ViewChartDonutComponent extends ViewChartComponent implements OnInit {

  public title:string = '';
  public chartType: string = 'donut';

  constructor() { 
    super();
  }

  ngOnInit() {
    this.showLegendValues = true;
  }

  makeConfig(){
    this.chartConfig = {
      bindto: '#' + this._chartId,
      data: {
        columns: this._data,
        type: this.chartType
      },
      donut:{
        title: this.title,
        width:15,
        label: {
          show: false
        }
      },
      size:{
        width: this.width,
        height: this.height
      },
      tooltip:{
        format: {
          value: (value, ratio, id, index) => {
            if(this.units){
              console.log("Units = " + this.units)
              return value + this.units; 
            } else {
              return value;
            }
          }
        }
      }
    }
    this.tooltipOptions = {
      show:false
    }
    return this.chartConfig;
  }

}
