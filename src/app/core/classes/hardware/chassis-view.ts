import { Container, Texture, Sprite } from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { Subject, Observable } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';
import { ThemeUtils } from 'app/core/classes/theme-utils';
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
import { DriveTray } from './drivetray';

export interface Range {
  start: number;
  end: number;
}

export interface Position {
  x?: number;
  y?: number;
}

export interface LayoutGenerator {
  generatePosition: (displayObject, index, xOffset?: number, yOffset?: number, orientation?: string) => Position;
}

export class ChassisView {
  /*
     * Don't use this class directly.
     * Instead extend this class for each
     * hardware unit with your customizations
     * */

  container: Container;
  events: Subject<CoreEvent>;
  model: string;
  driveTray: DriveTray;
  driveTraysOffsetY = 0; // if drives don't start at top.
  driveTraysOffsetX = 0; // if drives don't start at top.
  driveTrays: any;
  driveTrayObjects: DriveTray[] = [];

  chassis: Sprite;
  chassisScale: Position;
  chassisOffsetY = 0; // if drives don't start at top.
  chassisOffsetX = 0; // if drives don't start at top.

  chassisPath: string;
  driveTrayBackgroundPath: string;
  driveTrayHandlePath: string;

  altDriveTraySlots: number[] = [];
  altDriveTrayBackgroundPath?: string;
  altDriveTrayHandlePath?: string;

  totalDriveTrays: number;
  slotRange: Range;
  rows: number;
  columns: number;
  orientation = 'rows'; // 'rows' || 'columns'
  layout?: LayoutGenerator;
  vertical = false;
  filters: any[] = [];
  disabledOpacity = 0.25;
  chassisOpacity = 0.25;
  initialized = false;
  loader: any;
  autoPosition = true;
  protected utils: ThemeUtils;
  gapX = 10;
  gapY = 2;

  constructor() {
    this.utils = new ThemeUtils();

    this.container = new PIXI.Container();
    this.driveTrays = new PIXI.projection.Container2d();
    this.events = new Subject<CoreEvent>();

    this.events.subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'ChangeDriveTrayColor':
          this.colorDriveTray(parseInt(evt.data.id), evt.data.color);
          break;
      }
    });

    // defaults
    this.rows = 6;
    this.columns = 4;
  }

  requiredAssets() {
    // Return a list of assets for the loader to fetch
    const assets: any[] = [];
    assets.push({ alias: `${this.model}_chassis`, path: this.chassisPath });
    assets.push({ alias: `${this.model}_drivetray_bg`, path: this.driveTrayBackgroundPath });
    assets.push({ alias: `${this.model}_drivetray_handle`, path: this.driveTrayHandlePath });
    return assets;
  }

  destroy() {
    // Destroy the loader and assets
    if (this.loader) {
      this.loader.reset();
    }
  }

  load() {
    // Create a dedicated loader to avoid conflicts with other loaders
    this.loader = new PIXI.loaders.Loader();
    // LOAD OUR ASSETS
    this.loader
      .add(`${this.model}_chassis`, this.chassisPath)
      .add(`${this.model}_drivetray_bg`, this.driveTrayBackgroundPath)
      .add(`${this.model}_drivetray_handle`, this.driveTrayHandlePath);

    // LOAD ALT UNIFORM ASSETS
    if (this.altDriveTraySlots.length > 0) {
      if (!this.altDriveTrayBackgroundPath || !this.altDriveTrayHandlePath) {
        console.error('Alt drive tray slots listed but no assets declared!');
      }
      this.loader.add(`${this.model}_alt_drivetray_bg`, this.altDriveTrayBackgroundPath)
        .add(`${this.model}_alt_drivetray_handle`, this.altDriveTrayHandlePath);
    }

    this.loader.on('progress', this.loadProgressHandler)
      .load(this.onLoaded.bind(this));
  }

  onLoaded() {
    const outlineFilterBlue = new PIXI.filters.OutlineFilter(2, 0x99ff99);
    const bloomFilter = new PIXI.filters.AdvancedBloomFilter({
      threshold: 0.9,
      bloomScale: 1.5,
      brightness: 1.5,
      blur: 20,
      quality: 10,
    });

    this.filters = [bloomFilter];

    // Render Chassis
    this.chassis = PIXI.Sprite.from(this.loader.resources[`${this.model}_chassis`].texture.baseTexture);
    this.chassis.name = `${this.model}_chassis`;
    this.chassis.alpha = 0;
    this.chassis.x = this.chassisOffsetX;
    this.chassis.y = this.chassisOffsetY;
    this.chassis.scale.x = this.chassisScale && this.chassisScale.x ? this.chassisScale.x : 1;
    this.chassis.scale.y = this.chassisScale && this.chassisScale.y ? this.chassisScale.y : 1;
    this.container.addChild(this.chassis);

    // Render DriveTrays
    if (!this.slotRange) {
      this.slotRange = { start: 1, end: this.totalDriveTrays };
    }
    for (let i = 0; i < this.totalDriveTrays; i++) {
      const slot: number = this.slotRange.start + i;

      const dt = this.altDriveTraySlots.length > 0 && this.altDriveTraySlots.indexOf(slot) != -1 ? this.makeDriveTray(true) : this.makeDriveTray();
      dt.id = slot.toString(); // Slot

      if (this.autoPosition) {
        const position = this.generatePosition(dt.container, i, this.driveTraysOffsetX, this.driveTraysOffsetY);
        dt.container.x = position.x;
        dt.container.y = position.y;
      }
      dt.background.alpha = 0;
      dt.handle.alpha = 0;
      dt.handle.filters = this.filters;

      dt.container.interactive = true;
      const clickHandler = (evt) => { this.onTap(evt, dt); };
      dt.container.on('click', clickHandler);

      this.driveTrays.addChild(dt.container);
      this.driveTrayObjects.push(dt);
    }

    this.generatePerspectiveOffset();
    this.driveTrays.name = `${this.model}_drivetrays`;
    this.container.addChild(this.driveTrays);

    this.events.next({ name: 'ChassisLoaded', sender: this });
    this.onEnter();
  }

  generatePerspectiveOffset() {
    this.driveTrays.x = 43;
    this.driveTrays.y = 78;
  }

  onTap(evt, driveTray) {
    this.events.next({ name: 'DriveSelected', data: driveTray });

    const startAlpha = driveTray.background.alpha;
    driveTray.background.alpha = 1;

    setTimeout(() => {
      const glow = (v) => driveTray.background.alpha = v;
      tween({
        from: 1,
        to: startAlpha,
        duration: 1000,
      }).start(glow);
    }, 300);
  }

  onEnter() {
    const opacity = this.disabledOpacity;
    const delay = 50;
    const duration = 50;

    setTimeout(() => {
      const fade = (v) => this.chassis.alpha = v;
      tween({
        from: 0,
        to: this.chassisOpacity ? this.chassisOpacity : opacity,
        duration,
      }).start(fade);
    }, delay);

    this.driveTrayObjects.forEach((item, index) => {
      // Staggered handles fade in
      setTimeout(() => {
        const updateAlpha = (v) => item.handle.alpha = v;

        tween({
          from: item.handle.alpha,
          to: item.enabled ? 1 : opacity,
          duration /* + 1000 */,
          ease: easing.backOut,
          // flip: Infinity
        }).start({
          update: (v) => { updateAlpha(v); },
          complete: () => {
            if (index == this.driveTrayObjects.length - 1) {
              this.events.next({ name: 'Ready' });
            }
          },
        });
      }, delay);

      // Staggered tray backgrounds fade in
      setTimeout(() => {
        const updateAlpha = (v) => item.background.alpha = v;

        tween({
          from: item.background.alpha,
          to: opacity,
          duration,
          ease: easing.backOut,
        }).start(updateAlpha);

        this.initialized = true;
      }, delay);
    });
  }

  loadProgressHandler() {
    // PIXI progress handler logic can go here
  }

  makeDriveTray(altAssets = false) {
    const dt = new DriveTray(this.model, this.loader);
    dt.vertical = this.vertical;
    dt.setup(altAssets);
    return dt;
  }

  generatePosition(displayObject, index, xOffset = 0, yOffset = 0): Position {
    if (this.layout) {
      return this.layout.generatePosition(displayObject, index, xOffset, yOffset, this.orientation);
    }

    // let gapX = 10;
    // let gapY = 2;
    const mod = index % this.columns;
    const nextPositionX = mod * (displayObject.width + this.gapX) + xOffset;
    const nextPositionY = Math.floor(index / this.columns) * (displayObject.height + this.gapY) + yOffset;

    return { x: nextPositionX, y: nextPositionY };
  }

  generatePerspective() {
    const dts = this.driveTrays;
    const x = 0;
    const y = 0;
    const quad = [
      { x, y }, // top left
      { x: x + dts.width, y }, // top right
      { x: x + dts.width - 25, y: y + dts.height }, // bottom right
      { x: x + 25, y: y + dts.height }, // bottom left
    ];

    dts.proj.mapSprite(dts, quad);
  }

  colorDriveTray(slot, color) {
    const driveIndex = slot - this.slotRange.start;
    if (driveIndex < 0 || driveIndex >= this.totalDriveTrays) {
      console.warn(`IGNORING DRIVE AT INDEX ${driveIndex} SLOT ${slot} IS OUT OF RANGE`);
      return;
    }
    const dt = this.driveTrayObjects[driveIndex];

    dt.color = color.toLowerCase();
    if (this.initialized) {
      dt.handle.alpha = color == 'none' ? this.disabledOpacity : 1;
    }
  }

  setChassisOpacity(value: number) {
    this.chassisOpacity = value;
    if (this.chassis) {
      // If chassis has already ben rendered to stage
      this.chassis.alpha = value;
    }
  }

  degreesToRadians(degrees) {
    const pi = Math.PI;
    return degrees * (pi / 180);
  }
}
