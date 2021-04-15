import { Container, Texture, Sprite } from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { Subject, Observable } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';
import {
  tween,
  styler,
  listen,
  pointer,
  value,
  decay,
  spring,
  physics,
  easing,
  everyFrame,
  keyframes,
  timeline,
  // velocity,
  multicast,
  action,
  transform,
  // transformMap,
  // clamp
} from 'popmotion';
import { LabelFactory } from './label-factory';
import { Chassis } from './chassis';
import { DriveTray } from './drivetray';

interface Position {
  x: number;
  y: number;
}

export class VDevLabels extends LabelFactory {
  /*
  * This is meant to put labels on
  * enclosure slots.
  * Don't use this class directly.
  * Instead extend this class for label
  * label functionality you need
  *
  */

  events: Subject<CoreEvent>;
  protected mainStage: any;
  protected app: any;
  protected chassis: Chassis; // The chassis we are labelling
  container: Container;
  protected domLabels: any;
  color: string;

  private textAreas: any;

  constructor(chassis, stage, color/* , domLabels */) {
    super(chassis, stage);
    // this.domLabels = domLabels;
    // console.log(this.domLabels);
    this.color = color;
    this.onInit(chassis, stage);
  }

  onInit(chassis, app) {
    this.chassis = chassis;
    this.app = app;
    this.mainStage = this.app.stage;

    this.container = new PIXI.Container();
    this.mainStage.addChild(this.container);
    this.container.x = 0;
    this.container.y = 0;
    this.container.width = this.mainStage.width;
    this.container.height = this.mainStage.height;

    this.defineTextAreas();

    this.events = new Subject<CoreEvent>();
    this.events.subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'LabelDrives':
          // console.log(evt);
          this.createVdevLabels(evt.data);
          break;
        case 'OverlayReady':
          // console.log(evt);
          this.traceElements(evt.data.vdev, evt.data.overlay);
          break;
      }
    });
  }

  onDestroy() {
    console.log('Clean up after yourself');
  }

  // Animate into view
  enter() {
    console.log('Animate into view...');
  }

  // Animate out of view
  exit() {
    this.mainStage.removeChild(this.container);

    this.mainStage.removeChild(this.textAreas.selected.container);
    this.textAreas.selected.container.destroy();

    this.mainStage.removeChild(this.textAreas.vdev.container);
    this.textAreas.vdev.container.destroy();
    // this.container.destroy();
    this.events.next({ name: 'LabelsDestroyed' });
  }

  createVdevLabelTile(x, y, w, h) {
    const tile = new PIXI.Graphics();

    // draw a rounded rectangle
    tile.lineStyle(1, this.parseColor(this.color), 1);
    tile.beginFill(this.parseColor(this.color), 0);
    // tile.drawRoundedRect(0, 0, 100, 100, 16);
    tile.drawRect(x, y, w, h);
    tile.endFill();

    return tile;
  }

  createVdevLabelText(diskName) {
    const style = new PIXI.TextStyle({
      fontFamily: 'Roboto',
      fontSize: 14, // double it and then scale it down for clarity
      fontWeight: 'normal',
      fill: ['#cccccc'],
    });

    const text = new PIXI.Text(diskName, style);
    // let text = new PIXI.extras.BitmapText(diskName, style);
    /* text.scale.x = 0.5;
    text.scale.y = 0.5; */

    // text.x = 120//this.textAreas.selected.width / 2 - text.width / 2;
    // text.y = 144//this.textAreas.selected.height / 2 - text.height / 2;
    text.name = 'vdev_label_text';

    return text;
  }

  createVdevLabels(vdev) {
    const disks = Object.keys(vdev.disks);// NOTE: vdev.slots only has values for current enclosure
    const xOffset = this.chassis.container.x + this.chassis.container.width + 16;
    const freeSpace = this.app._options.width - xOffset;
    const gap = 3;

    // Simulate disks that live on another enclosure
    /* for(let i = 10; i < 21; i++){
      disks.push('ada' + i);
    } */

    disks.forEach((disk, index) => {
      let present = false; // Is the disk in this enclosure?
      if (typeof vdev.slots[disk] !== 'undefined') {
        present = true;
        // Create tile if the disk is in the current enclosure
        const src = this.chassis.driveTrayObjects[vdev.slots[disk]].container;
        const tray = src.getGlobalPosition();

        const tile = this.createVdevLabelTile(tray.x, tray.y, src.width * this.chassis.container.scale.x, src.height * this.chassis.container.scale.y);
        tile.name = `tile_${disk}`;
        // tile.renderCanvas()
        this.textAreas.vdev.container.addChild(tile);
      }
    });
  }

  traceElements(vdev, overlay) {
    const disks = Object.keys(vdev.disks);// NOTE: vdev.slots only has values for current enclosure
    disks.forEach((disk, index) => {
      let present = false; // Is the disk in this enclosure?
      if (typeof vdev.slots[disk] !== 'undefined') {
        present = true;
        // Create tile if the disk is in the current enclosure
        const src = this.textAreas.vdev.container.getChildByName(`tile_${disk}`);
        const tray = src.getLocalBounds();

        const el = overlay.nativeElement.querySelector(`div.vdev-disk.${disk}`);
        const startX = tray.x + tray.width;
        const startY = tray.y + tray.height / 2;
        const endX = el.offsetLeft + el.offsetParent.offsetLeft;
        const endY = el.offsetTop + el.offsetParent.offsetTop + (el.offsetHeight / 2);
        this.createTrace(startX, startY, endX, endY);
      }
    });
  }

  createTrace(startX, startY, endX, endY) {
    const graphics = new PIXI.Graphics(true);
    // draw a shape
    graphics.beginFill(this.parseColor(this.color));
    graphics.lineStyle(1, this.parseColor(this.color), 1);
    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
    graphics.endFill();
    // graphics.renderCanvas();

    this.textAreas.vdev.container.addChild(graphics);
  }

  createLabel(vdev) {
    const style = new PIXI.TextStyle({
      fontFamily: 'Roboto',
      fontSize: 48, // double it and then scale it down for clarity
      fontStyle: 'normal',
      fill: ['#cccccc'],
    });

    console.log(vdev.selectedDisk);
    const text = new PIXI.Text(vdev.selectedDisk, style);
    text.scale.x = 0.5;
    text.scale.y = 0.5;
    // text.x = 120//this.textAreas.selected.width / 2 - text.width / 2;
    // text.y = 144//this.textAreas.selected.height / 2 - text.height / 2;
    text.name = 'selected_disk_text';
    this.textAreas.vdev.container.addChild(text);
    console.log(this.textAreas.selected);
  }

  private defineTextAreas() {
    // selected disk on left and other vdev disks on right
    const selectedDiskLabel = new PIXI.Container();
    selectedDiskLabel.name = 'selected_disk_label';

    const vDevLabels = new PIXI.Container();
    vDevLabels.name = 'vdev_labels';

    this.textAreas = {
      selected: {
        container: selectedDiskLabel,
        top: 16,
        right: this.chassis.container.x - 16,
        bottom: this.mainStage.height - 16,
        left: 16,
      },
      vdev: {
        container: vDevLabels,
        top: 16,
        right: this.mainStage.width - 16,
        bottom: this.mainStage.height - 16,
        left: this.chassis.container.x + this.chassis.container.width,
      },
    };

    this.setBounds(this.textAreas.selected);
    this.setBounds(this.textAreas.vdev);

    this.mainStage.addChild(selectedDiskLabel);
    this.mainStage.addChild(vDevLabels);

    console.log(this.app);
  }

  protected setBounds(obj) {
    obj.container.width = obj.right - obj.left;
    obj.container.height = obj.bottom - obj.top;
  }

  protected parseColor(color: string) {
    return parseInt(`0x${color.substring(1)}`, 16);
  }
}
