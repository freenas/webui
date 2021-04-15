import {
  Component, AfterViewInit, Input, ViewChild, OnDestroy, ElementRef,
} from '@angular/core';
import {
  DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl,
} from '@angular/platform-browser';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { Subject } from 'rxjs';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';

import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import Chart from 'chart.js';

// Deprecated
import * as d3 from 'd3';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';

import { ViewChartGaugeComponent } from 'app/core/components/viewchartgauge/viewchartgauge.component';
import { ViewChartBarComponent } from 'app/core/components/viewchartbar/viewchartbar.component';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

interface DataPoint {
  usage?: number | string;
  temperature?: number | string;
  coreNumber: number;
}

// For Chart.js
interface DataSet {
  label: string[];
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
}

@Component({
  selector: 'widget-memory',
  templateUrl: './widgetmemory.component.html',
  styleUrls: ['./widgetmemory.component.css'],
})
export class WidgetMemoryComponent extends WidgetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('memorygauge', { static: true }) cpuLoad: ViewChartGaugeComponent;
  @ViewChild('cores', { static: true }) cpuCores: ViewChartBarComponent;
  @Input() data: Subject<CoreEvent>;
  @Input() ecc = false;
  chart: any;// chart instance
  ctx: any; // canvas context for chart.js
  private _memData: any;
  get memData() { return this._memData; }
  set memData(value) {
    this._memData = value;
    if (this.legendData && typeof this.legendIndex !== 'undefined') {
      // C3 does not have a way to update tooltip when new data is loaded.
      // So this is the workaround
      this.legendData[0].value = this.memData.data[0][this.legendIndex + 1];
      this.legendData[1].value = this.memData.data[1][this.legendIndex + 1];
    }
  }

  isReady = false;
  usage: any;
  title: string = T('Memory');
  subtitle: string = T('% of all cores');
  widgetColorCssVar = 'var(--accent)';
  configurable = false;
  chartId = UUID.UUID();
  memTotal: number;
  legendData: any;
  colorPattern: string[];
  currentTheme;

  legendColors: string[];
  private legendIndex: number;
  labels: string[] = [T('Free'), T('ZFS Cache'), T('Services')];

  screenType = 'Desktop';

  constructor(public router: Router, public translate: TranslateService, private sanitizer: DomSanitizer, public mediaObserver: MediaObserver, private el: ElementRef) {
    super(translate);
    mediaObserver.media$.subscribe((evt) => {
      const st = evt.mqAlias == 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }

  ngOnDestroy() {
    this.core.unregister({ observerClass: this });
  }

  ngAfterViewInit() {
    this.data.subscribe((evt: CoreEvent) => {
      if (evt.name == 'ZfsStats') {
        if (evt.data.arc_size) {
        }
      }
      if (evt.name == 'MemoryStats') {
        if (evt.data.used) {
          this.setMemData(evt.data);
        }
      }
    });

    if (this.chart) {
      this.renderChart();
    }
  }

  bytesToGigabytes(value) {
    return value / 1024 / 1024 / 1024;
  }

  parseMemData(data) {
    /*
     * PROVIDED BY MIDDLEWARE
     * total
     * available
     * percent
     * used
     * free
     * active
     * inactive
     * buffers
     * cached
     * shared
     * wired
     * zfs_cache?
     * */

    const services = data['total'] - data['free'] - data['arc_size'];

    const columns = [
      ['Free', this.bytesToGigabytes(data['free']).toFixed(1)],
      ['ZFS Cache', this.bytesToGigabytes(data['arc_size']).toFixed(1)],
      ['Services', this.bytesToGigabytes(services).toFixed(1)],
    ];

    return columns;
  }

  aggregate(data) {
    return data.reduce((total, num) => total + num);
  }

  setMemData(data) {
    const config: any = {};
    config.title = 'Cores';
    config.orientation = 'vertical';
    config.units = 'GiB';
    config.max = this.bytesToGigabytes(data.total).toFixed(1);
    config.data = this.parseMemData(data);
    this.memData = config;
    this.memChartInit();
  }

  memChartInit() {
    this.currentTheme = this.themeService.currentTheme();
    this.colorPattern = this.processThemeColors(this.currentTheme);
    const startW = this.el.nativeElement.querySelector('#memory-usage-chart');

    this.isReady = true;
    this.renderChart();
  }

  trustedSecurity(style) {
    return this.sanitizer.bypassSecurityTrustStyle(style);
  }

  // chart.js renderer
  renderChart() {
    if (!this.ctx) {
      const el = this.el.nativeElement.querySelector('#memory-usage-chart canvas');
      if (!el) { return; }

      const ds = this.makeDatasets(this.memData.data);
      this.ctx = el.getContext('2d');

      const data = {
        labels: this.labels,
        datasets: ds,
      };

      const options = {
        // cutoutPercentage:85,
        tooltips: {
          enabled: false,
        },
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        responsiveAnimationDuration: 0,
        animation: {
          duration: 1000,
          animateRotate: true,
          animateScale: true,
        },
        hover: {
          animationDuration: 0,
        },
      };

      this.chart = new Chart(this.ctx, {
        type: 'doughnut',
        data,
        options,
      });
    } else {
      const ds = this.makeDatasets(this.memData.data);

      this.chart.data.datasets[0].data = ds[0].data;
      this.chart.update();
    }
  }

  protected makeDatasets(data: any): DataSet[] {
    const datasets = [];

    const ds: DataSet = {
      label: this.labels,
      data: data.map((x) => x[1]),
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
    };

    // Create the data...
    data.forEach((item, index) => {
      const bgRGB = this.utils.hexToRGB(this.colorPattern[index]).rgb;
      const borderRGB = this.utils.hexToRGB(this.currentTheme.bg2).rgb;

      ds.backgroundColor.push(this.rgbToString(bgRGB, 0.85));
      ds.borderColor.push(this.rgbToString(bgRGB));
    });

    datasets.push(ds);

    return datasets;
  }

  private processThemeColors(theme): string[] {
    const colors: string[] = [];
    theme.accentColors.map((color) => {
      colors.push(theme[color]);
    });
    return colors;
  }

  rgbToString(rgb: string[], alpha?: number) {
    const a = alpha ? alpha.toString() : '1';
    return `rgba(${rgb.join(',')},${a})`;
  }
}
