export interface ActiveDirectoryConfig {
  allow_dns_updates: boolean;
  allow_trusted_doms: boolean;
  bindname: string;
  bindpw: string;
  createcomputer: string;
  disable_freenas_cache: boolean;
  dns_timeout: number;
  domainname: string;
  enable: boolean;
  id: number;
  kerberos_principal: string;
  kerberos_realm: {
    id: string;
  };
  netbiosalias: unknown[];
  netbiosname: string;
  nss_info: unknown;
  restrict_pam: boolean;
  site: unknown;
  timeout: number;
  use_default_domain: boolean;
  verbose_logging: boolean;
}
