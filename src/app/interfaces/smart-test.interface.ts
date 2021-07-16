import { SmartPowerMode } from 'app/enums/smart-power.mode';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { Schedule } from 'app/interfaces/schedule.interface';

export interface SmartTest {
  all_disks: boolean;
  desc: string;
  disks: string[];
  id: number;
  schedule: Schedule;
  type: SmartTestType;
}

export interface SmartTestUi extends SmartTest {
  cron_schedule: string;
  frequency: string;
  next_run: string;
}

export interface SmartConfig {
  critical: number;
  difference: number;
  id: number;
  informational: number;
  interval: number;
  powermode: SmartPowerMode;
}

export type SmartConfigUpdate = Omit<SmartConfig, 'id'>;

export interface SmartManualTestParams {
  identifier: string;
  type: SmartTestType;
}
