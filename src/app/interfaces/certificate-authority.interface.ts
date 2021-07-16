import { CACreateType } from '../enums/ca-create-type.enum';
import { CertificateDigestAlgorithm } from '../enums/ca-digest-algorithm.enum';
import { CertificateKeyType } from '../enums/ca-key-type.enum';
import { EcCurve } from '../enums/ec-curve.enum';
import { ExtendedKeyUsages } from '../enums/extended-key-usages.enum';

export interface BasicConstraints {
  ca: boolean;
  enabled: boolean;
  path_length: number;
  extension_critical: boolean;
}

export interface AuthorityKeyIdentifier {
  authority_cert_issuer: boolean;
  enabled: boolean;
  extension_critical: boolean;
}

export interface ExtendedKeyUsage {
  usages: ExtendedKeyUsages;
  enabled: boolean;
  extension_critical: boolean;
}

export interface KeyUsage {
  enabled: boolean;
  digital_signature: boolean;
  content_commitment: boolean;
  key_encipherment: boolean;
  data_encipherment: boolean;
  key_agreement: boolean;
  key_cert_sign: boolean;
  crl_sign: boolean;
  encipher_only: boolean;
  decipher_only: boolean;
  extension_critical: boolean;
}

export interface CertificateExtensions {
  BasicConstraints: BasicConstraints;
  AuthorityKeyIdentifier: AuthorityKeyIdentifier;
  ExtendedKeyUsage: ExtendedKeyUsage;
  KeyUsage: KeyUsage;
}

export interface CertificateAuthorityUpdate {
  tos: boolean;
  csr_id: number;
  signedby: number;
  key_length: number;
  renew_days: number;
  type: number;
  lifetime: number;
  serial: number;
  acme_directory_uri: string;
  certificate: string;
  city: string;
  common: string;
  country: string;
  CSR: string;
  ec_curve: EcCurve;
  email: string;
  key_type: CertificateKeyType;
  name: string;
  organization: string;
  organizational_unit: string;
  passphrase: string;
  privatekey: string;
  state: string;
  create_type: CACreateType;
  digest_algorithm: CertificateDigestAlgorithm;
  san: string[];
  cert_extensions: CertificateExtensions;
}

export interface CertificateAuthorityCreate extends CertificateAuthorityUpdate {}

export interface CertificateAuthority {
  CA_type_existing: boolean;
  CA_type_intermediate: boolean;
  CA_type_internal: boolean;
  CSR: unknown;
  DN: string;
  cert_type: string; // Enum?
  cert_type_CSR: boolean;
  cert_type_existing: boolean;
  cert_type_internal: boolean;
  certificate: string;
  certificate_path: string;
  chain: boolean;
  chain_list: string[];
  city: string;
  common: string;
  country: string;
  crl_path: string;
  csr_path: string;
  digest_algorithm: string;
  email: string;
  extensions: {
    AuthorityKeyIdentifier: string;
    BasicConstraints: string;
    ExtendedKeyUsage: string;
    KeyUsage: string;
    SubjectAltName: string;
    SubjectKeyIdentifier: string;
  };
  fingerprint: string;
  from: string;
  id: number;
  internal: string;
  issuer: string;
  key_length: number;
  key_type: string;
  lifetime: number;
  name: string;
  organization: string;
  organizational_unit: string;
  parsed: boolean;
  privatekey: string;
  privatekey_path: string;
  revoked: boolean;
  revoked_certs: unknown[];
  revoked_date: unknown;
  root_path: string;
  san: string[];
  serial: number;
  signed_certificates: number;
  signedby: unknown;
  state: string;
  subject_name_hash: number;
  type: number;
  until: string;
}
