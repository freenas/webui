export interface NtpServer {
  address: string;
  burst: boolean;
  iburst: boolean;
  id: number;
  maxpoll: number;
  minpoll: number;
  prefer: boolean;
}
