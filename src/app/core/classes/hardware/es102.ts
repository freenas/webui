import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView, Position, LayoutGenerator } from './chassis-view';

export class ES102 extends Chassis {
  constructor() {
    super();
    this.model = 'es102';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/es102/es102_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/es102/es102_960w_drivetray_handle.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/es102/es102_960w_drivetray_bg_grey.png';

    this.front.totalDriveTrays = 102;
    this.front.rows = 12;
    this.front.columns = 8;
    this.front.orientation = 'columns';

    // Scale
    this.front.chassisScale = { x: 1.025, y: 1.1 };
    this.front.driveTrays.scale.x = 1;
    this.front.driveTrays.scale.y = 1;

    // Offsets
    this.front.driveTraysOffsetX = -20;
    this.front.driveTraysOffsetY = -47;

    this.front.layout = {
      generatePosition: (displayObject, index, offsetX, offsetY, orientation) => {
        const gapX = 4;// was 16
        const gapY = 2;

        const cols = [
          {
            start: 0, count: 14, iomGap: 38, iomIndex: 7,
          },
          {
            start: 14, count: 14, iomGap: 38, iomIndex: 7,
          },
          {
            start: 28, count: 14, iomGap: 38, iomIndex: 7,
          },
          {
            start: 42, count: 12, iomGap: 100, iomIndex: 6,
          },
          {
            start: 54, count: 12, iomGap: 70, iomIndex: 6,
          },
          {
            start: 66, count: 12, iomGap: 70, iomIndex: 6,
          },
          {
            start: 78, count: 12, iomGap: 70, iomIndex: 6,
          },
          {
            start: 90, count: 12, iomGap: 70, iomIndex: 6,
          },
        ];

        const getCurrentColumn = () => {
          const test = cols.map((c, ci) => {
            if (index >= c.start && index <= (c.start + c.count - 1)) return ci;
          });
          return test.filter((v) => v !== undefined)[0];
        };

        const currentColumn = getCurrentColumn();
        const col = cols[currentColumn];

        const mod = (index - col.start) % col.count; // this.front[orientation];
        const iomGapX = currentColumn > 3 ? 30 : 0;
        const iomGapY = (index - col.start) >= col.iomIndex ? col.iomGap : 0;

        // let nextPositionX = Math.floor(index / this.front[orientation]) * (displayObject.width + gapX);
        // let nextPositionY = mod * (displayObject.height + gapY);

        const nextPositionX = (displayObject.width + gapX) * currentColumn;
        let nextPositionY = mod * (displayObject.height + gapY);

        if (currentColumn > 3) {
          nextPositionY += 15;
        }

        return { x: nextPositionX + offsetX + iomGapX, y: nextPositionY + offsetY + iomGapY };
      },
    };
  }

  /* isBelowModules(index): boolean{
    return index > 5;
  } */

  /* generatePosition(displayObject, index): Position{
    console.log("ES102: GENERATING POSITION");
    let gapX = 8;// was 16
    let gapY = 6;
    let mod = index % this.front[this.front.orientation];
    let m = index % 2;
    if(m == 0){
      console.log("even");
      this.front.colorDriveTray(index, "#CC00CC");
    }

    let nextPositionX = Math.floor(index / this.front[this.front.orientation]) * (displayObject.width + gapX);
    let nextPositionY = mod * (displayObject.height + gapY);

    return {x: nextPositionX, y: nextPositionY};
  } */

  generatePerspectiveOffset() {
    this.front.driveTrays.transform.position.x = 32;
    this.front.driveTrays.transform.position.y = 32;
  }
}
