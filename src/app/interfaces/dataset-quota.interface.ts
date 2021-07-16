import { DatasetQuotaType } from 'app/enums/dataset-quota-type.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';

export interface DatasetQuota {
  id: number;
  name: string;
  obj_quota: number;
  obj_used: number;
  obj_used_percent: number;
  quota: number;
  quota_type: DatasetQuotaType;
  used_bytes: number;
  used_percent: number;
}

export type DatasetQuotaQueryParams = [
  /* mounpoint */ string,
  /* quotaType */ DatasetQuotaType,
  /* params */ QueryParams<DatasetQuota>,
];
