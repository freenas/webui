import { T } from "app/translate-marker";
import { Validators } from "@angular/forms";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";

export const helptext_sharing_iscsi = {
  target_form_placeholder_name: T("Target Name"),
  target_form_tooltip_name: T(
    'The base name is automatically prepended if the target\
 name does not start with <i>iqn</i>. Lowercase alphanumeric\
 characters plus dot (.), dash (-), and colon (:) are allowed.\
 See the <i>Constructing iSCSI names using the iqn.format</i>\
 section of <a href="https://tools.ietf.org/html/rfc3721.html"\
 target="_blank">RFC3721</a>.'
  ),
  target_form_validators_name: [Validators.required],

  target_form_placeholder_alias: T("Target Alias"),
  target_form_tooltip_alias: T("Optional user-friendly name."),

  target_form_placeholder_portal: T("Portal Group ID"),
  target_form_tooltip_portal: T(
    "Leave empty or select number of existing portal to use."
  ),
  target_form_validators_portal: [Validators.required],

  target_form_placeholder_initiator: T("Initiator Group ID"),
  target_form_tooltip_initiator: T(
    "Select which existing initiator group\
 has access to the target."
  ),

  target_form_placeholder_authmethod: T("Auth Method"),
  target_form_tooltip_authmethod: T(
    "Choices are <i>None, Auto, CHAP,</i> or <i>Mutual CHAP</i>."
  ),

  target_form_placeholder_auth: T("Authentication Group number"),
  target_form_tooltip_auth: T(
    "Select <i>None</i> or an integer. This value\
 represents the number of existing authorized accesses."
  ),

  target_form_placeholder_delete: T("Delete"),

  portal_form_placeholder_comment: T("Comment"),
  portal_form_tooltip_comment: T(
    "Optional description. Portals are automatically\
 assigned a numeric group ID."
  ),

  portal_form_placeholder_discovery_authmethod: T("Discovery Auth Method"),
  portal_form_tooltip_discovery_authmethod: T(
    '<a href="%%docurl%%/sharing.html%%webversion%%#block-iscsi"\
 target="_blank">iSCSI</a> supports multiple\
 authentication methods that are used by the target to\
 discover valid devices. <i>None</i> allows anonymous\
 discovery while <i>CHAP</i> and <i>Mutual CHAP</i>\
 require authentication.'
  ),

  portal_form_placeholder_discovery_authgroup: T("Discovery Auth Group"),
  portal_form_tooltip_discovery_authgroup: T(
    "Select a user created in <b>Authorized Access</b> if\
 the <b>Discovery Auth Method</b> is set to\
 <i>CHAP</i> or <i>Mutual CHAP</i>."
  ),

  portal_form_placeholder_ip: T("IP Address"),
  portal_form_tooltip_ip: T(
    "Select the IP address associated with an interface\
 or the wildcard address of <i>0.0.0.0</i> (any interface)."
  ),
  portal_form_validators_ip: [Validators.required],

  portal_form_placeholder_port: T("Port"),
  portal_form_tooltip_port: T(
    "TCP port used to access the iSCSI target.\
 Default is <i>3260</i>."
  ),
  portal_form_validators_port: [Validators.required],

  portal_form_placeholder_delete: T("Delete"),

  initiator_form_placeholder_initiators: T("Initiators"),
  initiator_form_tooltip_initiators: T(
    "Use <i>ALL</i> keyword or a list of initiator hostnames separated by spaces."
  ),

  initiator_form_placeholder_auth_network: T("Authorized Networks"),
  initiator_form_tooltip_auth_network: T(
    'Network addresses that can use this initiator. Use\
 <i>ALL</i> or list network addresses with a\
 <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing"\
 target="_blank">CIDR</a> mask. Separate multiple\
 addresses with a space:\
 <i>192.168.2.0/24 192.168.2.1/12</i>.'
  ),

  initiator_form_placeholder_comment: T("Comment"),
  initiator_form_tooltip_comment: T("Optional description."),

  globalconf_placeholder_basename: T("Base Name"),
  globalconf_tooltip_basename: T(
    'Lowercase alphanumeric characters plus dot (.), dash (-),\
 and colon (:) are allowed. See the\
 <i>Constructing iSCSI names using the iqn.format</i>\
 section of <a href="https://tools.ietf.org/html/rfc3721.html"\
 target="_blank">RFC3721</a>.'
  ),
  globalconf_validators_basename: [Validators.required],

  globalconf_placeholder_isns_servers: T("ISNS Servers"),
  globalconf_tooltip_isns_servers: T(
    "Enter the hostnames or IP addresses of the\
 ISNS servers to be registered with the\
 iSCSI targets and portals of the system.\
 Separate each entry with a space."
  ),

  globalconf_placeholder_pool_avail_threshold: T(
    "Pool Available Space Threshold (%)"
  ),
  globalconf_tooltip_pool_avail_threshold: T(
    'Enter the percentage of free space to remain\
 in the pool. When this percentage is reached,\
 the system issues an alert, but only if zvols are used.\
 See <a href="%%docurl%%/vaai.html%%webversion%%#vaai"\
 target="_blank">VAAI Threshold Warning</a> for more\
 information.'
  ),

  globalconf_dialog_title: T("Enable service"),
  globalconf_dialog_message: T("Enable this service?"),
  globalconf_dialog_button: T("Enable Service"),

  globalconf_snackbar_message: T("Service started"),
  globalconf_snackbar_close: T("close"),

  extent_placeholder_name: T("Extent name"),
  extent_tooltip_name: T(
    "Enter the extent name. The name cannot be an existing\
 file within the pool or dataset when the\
 <b>Extent size</b> is something other than <i>0</i>."
  ),
  extent_validators_name: [Validators.required],

  extent_placeholder_type: T("Extent type"),
  extent_tooltip_type: T("Select from <i>File</i> or <i>Device</i>."),

  extent_placeholder_disk: T("Device"),
  extent_tooltip_disk: T(
    "Only appears if <i>Device</i> is selected. Select the\
 unformatted disk, controller, zvol snapshot, or\
 HAST device."
  ),
  extent_validators_disk: [Validators.required],

  extent_placeholder_serial: T("Serial"),
  extent_tooltip_serial: T(
    "Unique LUN ID. The default is generated from\
 the MAC address of the system."
  ),

  extent_placeholder_path: T("Path to the extent"),
  extent_tooltip_path: T(
    "Browse to an existing file and use <i>0</i> as the\
 <b>Extent size</b>, or browse to the pool or dataset,\
 click <b>Close</b>, append the <b>Extent Name</b> to\
 the path, and specify a value in <b>Extent Size</b>.\
 Extents cannot be created inside the jail\
 root directory."
  ),
  extent_validators_path: [Validators.required],

  extent_placeholder_filesize: T("Extent size"),
  extent_tooltip_filesize: T(
    "If the size is specified as <i>0</i>, the file must\
 already exist and the actual file size will be used.\
 Otherwise, specify the size of the file to create."
  ),
  extent_validators_filesize: [Validators.required],

  extent_placeholder_blocksize: T("Logical block size"),
  extent_tooltip_blocksize: T(
    "Only override the default if the initiator\
 requires a different block size."
  ),

  extent_placeholder_pblocksize: T("Disable physical block size reporting"),
  extent_tooltip_pblocksize: T(
    "Set if the initiator does not support physical block\
 size values over 4K (MS SQL)."
  ),

  extent_placeholder_avail_threshold: T("Available space threshold (%)"),
  extent_tooltip_avail_threshold: T(
    'Only appears if a <i>File</i> or zvol is selected. When\
 the specified percentage of free space is reached,\
 the system issues an alert.\
 See <a href="%%docurl%%/vaai.html%%webversion%%#vaai"\
 target="_blank">VAAI</a> Threshold Warning.'
  ),

  extent_placeholder_comment: T("Comment"),
  extent_tooltip_comment: T("Enter any notes."),

  extent_placeholder_insecure_tpc: T("Enable TPC"),
  extent_tooltip_insecure_tpc: T(
    'Set to allow an initiator to bypass normal access\
 control and access any scannable target. This allows\
 <a\
 href="https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-R2-and-2012/cc771254(v=ws.11)"\
 target="_blank">xcopy</a> operations which are\
 otherwise blocked by access control.'
  ),

  extent_placeholder_xen: T("Xen initiator compat mode"),
  extent_tooltip_xen: T("Set when using Xen as the iSCSI initiator."),

  extent_placeholder_rpm: T("LUN RPM"),
  extent_tooltip_rpm: T(
    "Do <b>NOT</b> change this setting when using Windows\
 as the initiator. Only needs to be changed in large\
 environments where the number of systems using a\
 specific RPM is needed for accurate reporting\
 statistics."
  ),

  extent_placeholder_ro: T("Read-only"),
  extent_tooltip_ro: T(
    "Set to prevent the initiator from initializing this\
 LUN."
  ),

  authaccess_placeholder_tag: T("Group ID"),
  authaccess_tooltip_tag: T(
    "Allows different groups to be configured\
 with different authentication profiles.\
 Example: all users with a group ID of\
 <i>1</i> will inherit the authentication profile\
 associated with Group <i>1</i>."
  ),
  authaccess_validators_tag: [Validators.required, Validators.min(0)],

  authaccess_placeholder_user: T("User"),
  authaccess_tooltip_user: T(
    "Enter name of user account to use\
 for CHAP authentication with the user on the remote\
 system. Many initiators\
 default to the initiator name as the user."
  ),
  authaccess_validators_user: [Validators.required],

  authaccess_placeholder_secret: T("Secret"),
  authaccess_tooltip_secret: T(
    "Enter a password for <b>User</b>.\
 Must be between 12 and 16 characters."
  ),
  authaccess_validators_secret: [
    Validators.minLength(12),
    Validators.maxLength(16),
    Validators.required,
    matchOtherValidator("secret_confirm")
  ],

  authaccess_placeholder_secret_confirm: T("Secret (Confirm)"),

  authaccess_placeholder_peeruser: T("Peer User"),
  authaccess_tooltip_peeruser: T(
    "Only input when configuring mutual CHAP.\
 In most cases it will need to be the same value\
 as <b>User</b>."
  ),

  authaccess_placeholder_peersecret: T("Peer Secret"),
  authaccess_tooltip_peersecret: T(
    "Enter the mutual secret password which\
 <b>must be different than the <i>Secret</i></b>.\
 Required if <b>Peer User</b> is set."
  ),
  authaccess_validators_peersecret: [
    Validators.minLength(12),
    matchOtherValidator("peersecret_confirm")
  ],

  authaccess_placeholder_peersecret_confirm: T("Peer Secret (Confirm)"),

  associated_target_placeholder_target: T("Target"),
  associated_target_tooltip_target: T("Select an existing target."),
  associated_target_validators_target: [Validators.required],

  associated_target_placeholder_lunid: T("LUN ID"),
  associated_target_tooltip_lunid: T(
    "Select the value or enter a value between\
 <i>0</i> and <i>1023</i>. Some initiators\
 expect a value below <i>256</i>. Using\
 <i>0</i> statically assigns the next\
 available ID."
  ),
  associated_target_validators_lunid: [
    Validators.min(0),
    Validators.max(1023),
    Validators.pattern(/^(0|[1-9]\d*)$/)
  ],

  associated_target_placeholder_extent: T("Extent"),
  associated_target_tooltip_extent: T("Select an existing extent."),
  associated_target_validators_extent: [Validators.required]
};
