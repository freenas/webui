import { Container, Texture, Sprite } from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { Subject, Observable } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';
import * as d3 from 'd3';
import { LabelFactory } from './label-factory';
import { ChassisView } from './chassis-view';
import { DriveTray } from './drivetray';

interface Position {
  x: number;
  y: number;
}

export class VDevLabelsSVG {
  /*
  * We create an SVG layer on top of the PIXI canvas
  * to achieve crisper lines. Apparently drawing
  * thin lines in WebGL is problematic without
  * resorting to caching them as bitmaps which
  * essentially renders them static.
  *
  */

  events: Subject<CoreEvent>;

  protected svg: any; // Our d3 generated svg layer
  protected mainStage: any; // WebGL Canvas
  protected app: any;
  protected chassis: ChassisView; // The chassis we are labelling
  color: string;
  selectedDiskColor: string;
  highlightColor: string;
  highlightedDiskName: string;
  selectedDisk: any;
  ClickByProxy;

  private textAreas: any;
  private trays: any = {};

  constructor(chassis, app, theme, disk) {
    this.selectedDisk = disk;
    this.color = 'var(--cyan)';
    this.selectedDiskColor = 'var(--yellow)';
    this.highlightColor = theme.yellow;

    this.onInit(chassis, app);
  }

  onInit(chassis, app) {
    this.chassis = chassis;
    this.app = app;
    this.mainStage = this.app.stage;
    this.d3Init();
    const paths = this.getParent().querySelectorAll('svg path');

    let tiles;
    this.events = new Subject<CoreEvent>();
    this.events.subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'ThemeChanged':
          const theme = evt.data;
          this.color = theme.blue;
          this.selectedDiskColor = theme.cyan;
          this.highlightColor = theme.yellow;
          break;
        case 'LabelDrives':
          this.createVdevLabels(evt.data);
          break;
        case 'OverlayReady':
          break;
        case 'ShowPath':
          break;
        case 'HidePath':
          break;
        case 'EnableHighlightMode':
          break;
        case 'DisableHighlightMode':
          tiles = this.getParent().querySelectorAll('rect.tile');
          this.showAllTiles(tiles);
          break;
        case 'HighlightDisk':
          tiles = this.getParent().querySelectorAll('rect.tile');
          this.hideAllTiles(tiles, [`tile tile_${this.selectedDisk.devname}`]);

          this.highlightedDiskName = evt.data.devname;
          this.showTile(evt.data.devname);
          break;
        case 'UnhighlightDisk':
          break;
      }
    });
  }

  onDestroy() {
  }

  // Animate into view
  enter() {
  }

  // Animate out of view
  exit() {
    const op = this.getParent();
    d3.select(`#${op.id} svg`).remove();
    d3.select(`#${op.id} canvas.clickpad`).remove();
    this.app.renderer.plugins.interaction.setTargetElement(this.app.renderer.view);
  }

  d3Init() {
    const op = this.getParent();

    this.svg = d3.select(`#${op.id}`).append('svg')
      .attr('width', op.offsetWidth)
      .attr('height', op.offsetHeight)
      .attr('style', 'position:absolute; top:0; left:0;');

    const clickpad = d3.select(`#${op.id}`).append('canvas') // This element will capture pointer for PIXI
      .attr('class', 'clickpad')
      .attr('width', op.offsetWidth)
      .attr('height', op.offsetHeight)
      .attr('style', 'position:absolute; top:0; left:0;');

    this.app.renderer.plugins.interaction.setTargetElement(op.querySelector('canvas.clickpad'));
  }

  getParent() {
    return this.app.renderer.view.offsetParent;
  }

  createVdevLabelTile(x, y, w, h, className, diskName) {
    const color = diskName == this.selectedDisk.devname ? this.selectedDiskColor : this.color;
    let opacity = diskName == this.selectedDisk.devname ? 1 : 0.5;
    opacity = 1;
    this.svg.append('rect')
      .attr('class', className)
      .attr('y', y)
      .attr('x', x)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', color)
      .attr('stroke', color)
      .attr('stroke-opacity', opacity)
      .attr('style', 'fill-opacity:0.25; stroke-width:1');
  }

  createVdevLabels(vdev) {
    const disks = vdev.disks ? Object.keys(vdev.disks) : [this.selectedDisk.devname]; // NOTE: vdev.slots only has values for current enclosure
    const xOffset = this.chassis.container.x + this.chassis.container.width + 16;
    const freeSpace = this.app._options.width - xOffset;
    const gap = 3;

    disks.forEach((disk, index) => {
      const present = !!(vdev.slots && vdev.slots[disk]); // Is the disk in this enclosure?
      const slot = typeof vdev.slots !== 'undefined' ? vdev.slots[disk] : this.selectedDisk.enclosure.slot;

      if (slot && slot >= this.chassis.slotRange.start && slot <= this.chassis.slotRange.end) {
        // Create tile if the disk is in the current enclosure
        const dt = this.chassis.driveTrayObjects.filter((dto) => parseInt(dto.id) == slot)[0];
        const src = dt.container;
        const tray = src.getGlobalPosition();

        const tileClass = `tile tile_${disk}`;

        const tileWidth = src.width * this.chassis.driveTrays.scale.x * this.chassis.container.scale.x;
        const tileHeight = src.height * this.chassis.driveTrays.scale.y * this.chassis.container.scale.y;

        this.createVdevLabelTile(tray.x, tray.y, tileWidth, tileHeight, tileClass, disk);
        this.trays[disk] = {
          x: tray.x, y: tray.y, width: tileWidth, height: tileHeight,
        };
      }
    });
  }

  calculateParentOffsets(el) {
    // Template uses CSS to center and align text so
    // we need to compensate with absolute positions
    // of wrapper elements

    // 1 up
    const legend = el.nativeElement.childNodes[0].childNodes[1];

    // 2 up
    const content = el.nativeElement.childNodes[0];

    const xOffset = el.nativeElement.offsetLeft + legend.offsetLeft + content.offsetLeft;
    const yOffset = el.nativeElement.offsetTop + legend.offsetTop + content.offsetTop;

    return { x: xOffset, y: yOffset - 6 };
  }

  traceElements(vdev, overlay, retrace?) {
    if (retrace) {
      this.svg.selectAll('path').remove();
    }

    const disks = Object.keys(vdev.disks);// NOTE: vdev.slots only has values for current enclosure
    const op = this.getParent();// Parent div
    disks.forEach((disk, index) => {
      let present = false; // Is the disk in this enclosure?
      if (typeof vdev.slots[disk] !== 'undefined') {
        present = true;
        // Create tile if the disk is in the current enclosure

        const tray = this.trays[disk];

        const el = overlay.nativeElement.querySelector(`div.vdev-disk.${disk}`);
        const parentOffsets = this.calculateParentOffsets(overlay);
        const startX = tray.x + tray.width;
        const startY = tray.y + tray.height / 2;
        const endX = el.offsetLeft + parentOffsets.x;// el.offsetParent.offsetLeft;
        const endY = el.offsetTop + parentOffsets.y + (el.offsetHeight / 2);
        this.createTrace(startX, startY, endX, endY, disk);
      }
    });
  }

  createTrace(startX, startY, endX, endY, diskName) {
    const color = diskName == this.selectedDisk.devname ? this.selectedDiskColor : this.color;
    const opacity = diskName == this.selectedDisk.devname ? 1 : 0.25;

    const svgPath = `M${startX} ${startY} L${endX} ${endY} Z`;

    this.svg.append('path')
      .attr('d', svgPath)
      .attr('stroke', color)
      .attr('stroke-opacity', opacity)
      .attr('class', diskName);
  }

  highlightTrace(devname) {
    if (devname == this.selectedDisk.devname) { return; }

    const targetEl = this.getParent().querySelector(`svg path.${devname}`);
    targetEl.setAttribute('stroke-opacity', 1);
  }

  unhighlightTrace(devname) {
    if (devname == this.selectedDisk.devname) { return; }

    const targetEl = this.getParent().querySelector(`svg path.${devname}`);
    targetEl.setAttribute('stroke-opacity', 1);
  }

  unhighlightAllTraces(traces, exceptions: string[]) {
    if (!exceptions) { exceptions = []; }

    traces.forEach((item, index) => {
      if (exceptions.includes(item.className.baseVal)) { return; }
      item.setAttribute('stroke-opacity', 1);
    });
    const tiles = this.getParent().querySelectorAll('rect.tile');
    this.showAllTiles(tiles);
  }

  showTrace(devname, overlay) {
    const labels = overlay.nativeElement.querySelectorAll('.vdev-disk');
    const paths = this.getParent().querySelectorAll('svg path');
    this.hideAllTraces(paths, [this.selectedDisk.devname, devname]);
    const op = this.getParent();
    const targetEl = op.querySelector(`svg path.${devname}`);
    targetEl.style['stroke-opacity'] = 1;
  }

  hideAllTraces(traces, exceptions: string[]) {
    if (!exceptions) { exceptions = []; }

    traces.forEach((item, index) => {
      if (exceptions.includes(item.className.baseVal)) { return; }
      item.style['stroke-opacity'] = 0;
    });
  }

  showTile(devname) {
    const targetEl = this.getParent().querySelector(`rect.tile_${devname}`);
    if (targetEl) {
      targetEl.style.opacity = 1;
    }
  }

  hideTile(devname) {
    const targetEl = this.getParent().querySelector(`rect.tile_${devname}`);
    if (targetEl) {
      targetEl.style.opacity = 0;
    }
  }

  hideAllTiles(tiles, exceptions?: string[]) {
    tiles.forEach((item, index) => {
      item.style.opacity = 0;
    });
  }

  showAllTiles(tiles, exceptions?: string[]) {
    tiles.forEach((item, index) => {
      item.style.opacity = 1;
    });
  }

  protected parseColor(color: string) {
    return parseInt(`0x${color.substring(1)}`, 16);
  }
}
