export interface OpenvpnServerConfig {
  additional_parameters: string;
  authentication_algorithm: string;
  cipher: string;
  compression: string;
  device_type: string;
  id: number;
  interface: string;
  netmask: number;
  port: number;
  protocol: string;
  root_ca: number;
  server: string;
  server_certificate: number;
  tls_crypt_auth: string;
  tls_crypt_auth_enabled: boolean;
  topology: string;
}
