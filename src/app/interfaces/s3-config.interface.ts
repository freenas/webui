export interface S3Config {
  access_key: string;
  bindip: string;
  bindport: number;
  browser: boolean;
  certificate: number;
  id: number;
  secret_key: string;
  storage_path: string;
}

export type S3ConfigUpdate = Omit<S3Config, 'id'>;
