import {
  Component, ViewChild, ElementRef, ChangeDetectorRef,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { DomSanitizer } from '@angular/platform-browser';
import { Point } from 'pixi.js';
import { MINI } from 'app/core/classes/hardware/mini';
import { MINIX } from 'app/core/classes/hardware/mini-x';
import { MINIXLPLUS } from 'app/core/classes/hardware/mini-xl-plus';
import { CoreService } from 'app/core/services/core-service/core.service';
import { DialogService } from 'app/services/dialog.service';
import { EnclosureDisksComponent } from './enclosure-disks.component';

@Component({
  selector: 'enclosure-disks-mini',
  templateUrl: './enclosure-disks-mini.component.html',
  styleUrls: ['./enclosure-disks.component.scss'],
})

export class EnclosureDisksMiniComponent extends EnclosureDisksComponent {
  @ViewChild('cardcontent', { static: true }) cardContent: ElementRef;

  temperatureScales = false;

  constructor(public el: ElementRef,
    protected core: CoreService,
    public sanitizer: DomSanitizer,
    public mediaObserver: MediaObserver,
    public cdr: ChangeDetectorRef,
    public dialogService: DialogService) {
    super(el, core, sanitizer, mediaObserver, cdr, dialogService);
    this.pixiWidth = 960 * 0.6; // PIXI needs an explicit number. Make sure the template flex width matches this
    this.pixiHeight = 480;
  }

  createExtractedEnclosure(): void {
    // MINIs have no support for expansion shelves
    // therefore we will never need to create
    // any enclosure selection UI. Leave this
    // empty or the base class will throw errors
  }

  createEnclosure(enclosure: any = this.selectedEnclosure): void {
    switch (enclosure.model) {
      case 'FREENAS-MINI-3.0-E':
      case 'FREENAS-MINI-3.0-E+':
        this.chassis = new MINI();
        break;
      case 'FREENAS-MINI-3.0-X':
      case 'FREENAS-MINI-3.0-X+':
        this.chassis = new MINIX();
        break;
      case 'FREENAS-MINI-3.0-XL+':
        this.chassis = new MINIXLPLUS();
        break;
      default:
        this.controllerEvent$.next({
          name: 'Error',
          data: {
            name: 'Unsupported Hardware',
            message: 'This chassis has an unknown or missing model value. METHOD: createEnclosure',
          },
        });
        this.aborted = true;
        break;
    }

    if (this.aborted) {
      return;
    }

    this.setupEnclosureEvents();

    // Slight adjustment to align with external html elements
    this.container.setTransform(-30);
  }

  count(obj: any): number {
    return Object.keys(obj).length;
  }

  stackPositions(log = false): Point[] {
    const result = this.enclosure.driveTrayObjects.map((dt) => dt.container.getGlobalPosition());

    if (log) {
      console.warn(result);
    }
    return result;
  }
}
