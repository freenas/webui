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
import { Chassis } from './chassis';
import { DriveTray } from './drivetray';

interface Position {
  x: number;
  y: number;
}

export class LabelFactory {
  /*
  * Don't use this class directly.
  * Instead extend this class for label
  * label functionality you need
  *
  */

  events: Subject<CoreEvent>;
  protected mainStage: any;
  protected chassis: Chassis; // The chassis we are labelling

  constructor(chassis, stage) {
    // this.onInit(chassis, stage);
  }

  onInit(chassis, stage) {
    this.chassis = chassis;
    this.mainStage = stage;
    this.events = new Subject<CoreEvent>();
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
    console.log('Animate out of view...');
  }
}
