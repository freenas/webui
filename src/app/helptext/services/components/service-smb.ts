import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { regexValidator } from '../../../pages/common/entity/entity-form/validators/regex-validation';

export default {
cifs_srv_netbiosname_placeholder: T('NetBIOS Name'),
cifs_srv_netbiosname_tooltip: T('Automatically populated with the original hostname\
 of the system. This name is limited to 15 characters and\
 cannot be the <b>Workgroup</b> name.'),
cifs_srv_netbiosname_validation : [ Validators.required, Validators.maxLength(15) ],

cifs_srv_netbiosalias_placeholder: T('NetBIOS Alias'),
cifs_srv_netbiosalias_tooltip: T('Enter an alias. Limited to 15 characters.'),
cifs_srv_netbiosalias_validation: [ Validators.maxLength(15) ],

cifs_srv_workgroup_placeholder: T('Workgroup'),
cifs_srv_workgroup_tooltip: T('Must match Windows workgroup\
 name. This setting is ignored if the\
 <a href="%%docurl%%/directoryservice.html%%webversion%%#active-directory"\
 target="_blank">Active Directory</a> or <a\
 href="%%docurl%%/directoryservice.html%%webversion%%#ldap"\
 target="_blank">LDAP</a> service is running.'),
cifs_srv_workgroup_validation : [ Validators.required ],

cifs_srv_description_placeholder: T('Description'),
cifs_srv_description_tooltip: T('Optional. Enter a server description.'),

cifs_srv_doscharset_placeholder: T('DOS Charset'),
cifs_srv_doscharset_tooltip: T('The character set Samba uses when communicating with\
 DOS and Windows 9x/ME clients. Default is CP437.'),

cifs_srv_unixcharset_placeholder: T('UNIX Charset'),
cifs_srv_unixcharset_tooltip: T('Default is UTF-8 which supports all characters in\
 all languages.'),

cifs_srv_loglevel_placeholder: T('Log Level'),
cifs_srv_loglevel_tooltip: T('Choices are <i>Minimum, Normal, or Debug</i>.'),
cifs_srv_loglevel_options: [
  { label: 'None', value: 0 },
  { label: 'Minimum', value: 1 },
  { label: 'Normal', value: 2 },
  { label: 'Full', value: 3 },
  { label: 'Debug', value: 10 },
],

cifs_srv_syslog_placeholder: T('Use syslog only'),
cifs_srv_syslog_tooltip: T('Set to log authentication failures in <i>/var/log/messages</i>\
 instead of the default of <i>/var/log/samba4/log.smbd</i>.'),

cifs_srv_localmaster_placeholder: T('Local Master'),
cifs_srv_localmaster_tooltip: T('Set to determine if the system participates in\
 a browser election. Leave unset when the network contains an AD\
 or LDAP server, or when Vista or Windows 7 machines\
 are present.'),

cifs_srv_domain_logons_placeholder: T('Domain Logons'),
cifs_srv_domain_logons_tooltip: T('Set if it is necessary to provide the netlogin\
 service for older Windows clients.'),

cifs_srv_timeserver_placeholder: T('Time Server For Domain'),
cifs_srv_timeserver_tooltip: T(' Enable to determine if the system advertises\
 itself as a time server to Windows clients.\
 Disable when the network contains an AD or LDAP server.'),

cifs_srv_guest_placeholder: T('Guest Account'),
cifs_srv_guest_tooltip: T('Account to be used for guest access. Default is\
 nobody. Account is required to have permissions to\
 the shared pool or dataset.\
 When the Guest Account user is deleted it resets to nobody.'),

cifs_srv_filemask_placeholder: T('File Mask'),
cifs_srv_filemask_tooltip: T('Overrides default file creation mask of <i>0666</i> which\
 creates files with read and write access for everybody.'),
cifs_srv_filemask_validation : [ regexValidator(/^[0-1]?[0-7][0-7][0-7]$/) ],

cifs_srv_dirmask_placeholder: T('Directory Mask'),
cifs_srv_dirmask_tooltip: T('Overrides default directory creation mask of <i>0777</i>\
 which grants directory read, write and execute access\
 for everybody.'),
cifs_srv_dirmask_validation : [ regexValidator(/^[0-1]?[0-7][0-7][0-7]$/) ],

cifs_srv_nullpw_placeholder: T('Allow Empty Password'),
cifs_srv_nullpw_tooltip: T('If set, users can press <b>Enter</b>\
 when prompted for a password. Requires the username\
 and password to be the same as the Windows user account.'),

cifs_srv_smb_options_placeholder: T('Auxiliary Parameters'),
cifs_srv_smb_options_tooltip: T('Enter additional <b>smb.conf</b> options. See the <a href="http://www.oreilly.com/openbook/samba/book/appb_02.html"\
 target="_blank">Samba Guide</a>\
 for more information on these settings.'),

cifs_srv_unixext_placeholder: T('UNIX Extensions'),
cifs_srv_unixext_tooltip: T('Set to allow non-Windows SMB clients to access symbolic\
 links and hard links. Has no effect on Windows clients.'),

cifs_srv_zeroconf_placeholder: T('Zeroconf share discovery'),
cifs_srv_zeroconf_tooltip: T('Enable if Mac clients will be connecting to the SMB share.'),

cifs_srv_hostlookup_placeholder: T('Hostnames Lookups'),
cifs_srv_hostlookup_tooltip: T('Set to allow using hostnames rather than IP addresses in\
 the <i>Hosts Allow</b> or </i>Hosts Deny</b> fields\
 of a SMB share. Leave this option\
 unset when IP addresses are used to avoid the delay of a host lookup.'),

cifs_srv_allow_execute_always_placeholder: T('Allow Execute Always'),
cifs_srv_allow_execute_always_tooltip: T('When selected, Samba allows the user to execute\
 a file, even if that user’s permissions are not set\
 to execute.'),

cifs_srv_obey_pam_restrictions_placeholder: T('Obey Pam Restrictions'),
cifs_srv_obey_pam_restrictions_tooltip: T('Unselect this option to allow cross-domain\
 authentication, users and groups to be managed on\
 another forest, and permissions to be delegated from\
 <a href="%%docurl%%/directoryservice.html%%webversion%%#active-directory"\
 target="_blank">Active Directory</a>\
 users and groups to domain admins on another forest.'),

cifs_srv_ntlmv1_auth_placeholder: T('NTLMv1 Auth'),
cifs_srv_ntlmv1_auth_tooltip: T('Off by default. When set,\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=smbd" target="_blank">smbd(8)</a>\
 attempts to authenticate users with the insecure\
 and vulnerable NTLMv1 encryption. This setting allows\
 backward compatibility with older versions of Windows,\
 but is not recommended and should not be used on\
 untrusted networks.'),

cifs_srv_bindip_placeholder: T('Bind IP Addresses'),
cifs_srv_bindip_tooltip: T('Select the IP addresses SMB will listen for.'),

idmap_tdb_range_low_placeholder: T('Range Low'),
idmap_tdb_range_low_tooltip: T('The beginning UID/GID for which this system is\
 authoritative. Any UID/GID lower than this value is ignored.\
 This avoids accidental UID/GID overlaps between local and remotely\
 defined IDs.'),

idmap_tdb_range_high_placeholder: T('Range High'),
idmap_tdb_range_high_tooltip: T('The ending UID/GID for which this system is authoritative.\
 Any UID/GID higher than this value is ignored.\
 This avoids accidental UID/GID overlaps between local\
 and remotely defined IDs.'),

cifs_srv_enable_smb1_placeholder: T('Enable SMB1 support'),
cifs_srv_enable_smb1_tooltip: T('Use this option to allow legacy SMB clients to connect to the\
 server. Note that SMB1 is being deprecated and it is advised\
 to upgrade clients to operating system versions that support\
 modern versions of the SMB protocol.')
}