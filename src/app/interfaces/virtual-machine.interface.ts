import { VmBootloader, VmCpuMode, VmTime } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';

export interface VirtualMachine {
  autostart: boolean;
  bootloader: VmBootloader;
  cores: number;
  cpu_mode: VmCpuMode;
  cpu_model: string;
  description: string;
  devices: VmDevice[];
  grubconfig: string;
  hide_from_msr: boolean;
  id: number;
  memory: number;
  name: string;
  shutdown_timeout: number;
  status: {
    state: string; // Enum? STOPPED
    pid: number;
    domain_state: string; // Enum? SHUTOFF
  };
  threads: number;
  time: VmTime;
  vcpus: number;
}

export type VmStopParams = [
  /* id */ number,
  /* params */ {
    force: boolean;
    force_after_timeout: boolean;
  },
];
