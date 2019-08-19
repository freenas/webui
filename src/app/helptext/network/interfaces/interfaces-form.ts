import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { rangeValidator } from '../../../pages/common/entity/entity-form/validators/range-validation';

export default {
int_type_placeholder: T('Type'),
int_type_tooltip: T('Choose the\
 type of interface. <i>Bridge</i> creates a logical link between\
 multiple networks. <i>Link Aggregation</i> combines multiple network\
 connections into a single interface. A <i>Virtual LAN (VLAN)</i> partitions\
 and isolates a segment of the connection. Read-only when editing an\
 interface.'),
int_type_options: [
    {label: "Bridge", value: "BRIDGE"},
    {label: "Link Aggregation", value: "LINK_AGGREGATION"},
    {label: "VLAN", value: "VLAN"},
],

int_interface_placeholder : T('NIC'),
int_interface_tooltip : T('Enter the FreeBSD device name of the\
 interface. This cannot be changed after the interface is created.'),
int_interface_validation : [ Validators.required ],

int_description_placeholder : T('Description'),
int_description_tooltip : T('Enter a description of the interface.'),

int_name_placeholder : T('Name'),
int_name_tooltip : T('Enter a name for the interface.\
 Use the format <samp>lagg<i>X</i></samp>,\
 <samp>vlan<i>X</i></samp>, or <samp>bridge<i>X</i></samp> where\
 <i>X</i> is a number representing a non-parent interface. Read-only\
 when editing an interface.'),
int_name_validation : [ Validators.required ],

int_dhcp_placeholder : T('DHCP'),
int_dhcp_tooltip : T('Set to enable DHCP. Leave unset to create a static\
 IPv4 or IPv6 configuration. Only one interface can\
 be configured for DHCP.'),

int_ipv6auto_placeholder : T('Autoconfigure IPv6'),
int_ipv6auto_tooltip : T('Set to automatically configure the IPv6 address with\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=rtsol"\
 target="_blank">rtsol(8)</a>. Only one interface can\
 be configured this way.'),

int_options_placeholder : T('Options'),
int_options_tooltip : T('Enter additional space-delimited parameters from <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=ifconfig"\
 target="_blank">ifconfig(8)</a>.'),

alias_address_placeholder: T('IP Address'),
alias_address_tooltip: T('Enter a static IPv4 or IPv6 address. Example:\
 <i>10.0.0.3</i>.'),

alias_netmaskbit_placeholder: T('Netmask'),
alias_netmaskbit_tooltip : T('Enter a netmask.'),

delete_placeholder: T('Delete'),
delete_tooltip: T('Set to delete this alias.'),

alias_address6_placeholder: T('IPv6 Address'),
alias_address6_tooltip: T('Enter a static IPv6 address if DHCP is unset.\
 Example: <i>2001:0db8:85a3:0000:0000:8a2e:0370:7334</i>'),

alias_netmaskbit6_placeholder: T('IPv6 Prefix Length'),
alias_netmaskbit6_tooltip : T('Select the prefix length used on the network.'),

delete_placeholder6: T('Delete'),
delete_tooltip6: T('Set to delete this alias.'),

bridge_members_placeholder: T('Bridge Members'),
bridge_members_tooltip: T('Network interfaces to include in the bridge.'),

failover_critical_placeholder: T('Critical'),
failover_critical_tooltip: T('Interfaces marked <i>critical</i> are\
 considered necessary for normal operation. When the last critical\
 interface in a failover group is preempted by the other storage\
 controller through the VRRP or CARP protocols, a failover is\
 triggered.'),

failover_group_placeholder: T('Failover Group'),
failover_group_tooltip: T('Multiple critical interfaces are combined into a single failover group. A failover is triggered if all of the interfaces in the group fail.'),

failover_vhid_placeholder: T('Failover VHID'),
failover_vhid_tooltip: T('Virtual Host ID for the failover interface.'),

failover_alias_address_placeholder: T('Failover IP Address'),
failover_alias_address_tooltip: T('IPv4 address to use for the failover interface. Set a manual IP address here if DHCP is not used.'),

failover_virtual_alias_address_placeholder: T('Virtual IP Address'),
failover_virtual_alias_address_tooltip: T(''),

vlan_pint_placeholder: T('Parent Interface'),
vlan_pint_tooltip: T('Select the VLAN Parent Interface. Usually an Ethernet\
 card connected to a switch port configured for the VLAN. New link\
 aggregations are not available until the system is restarted.'),
vlan_pint_validation: [Validators.required],

vlan_tag_placeholder: T('Vlan Tag'),
vlan_tag_tooltip: T('Enter the numeric tag configured in the switched network.'),
vlan_tag_validation: [rangeValidator(1, 4095), Validators.required],

vlan_pcp_placeholder: T('Priority Code Point'),
vlan_pcp_tooltip: T('Select the Class of Service. The available 802.1p\
 Class of Service ranges from <i>Best effort (default)</i> \
 to <i>Network control (highest)</i>.'),

lagg_protocol_placeholder : T('Lagg Protocol'),
lagg_protocol_tooltip : T('Select the <a\
 href="--docurl--/network.html--webversion--#link-aggregations"\
 target="_blank">Protocol Type</a>.<br>\
 <i>LACP</i> is the recommended protocol if the network\
 switch is capable of active LACP.<br>\
 <i>Failover</i> is the default protocol choice and\
 should only be used if the network switch does not\
 support active LACP.'),
lagg_protocol_validation : [ Validators.required ],
lagg_protocol_options: [
    {label:"None", value:"NONE"},
    {label:"LACP", value:"LACP"}, 
    {label:"Failover", value:"FAILOVER"}, 
    {label:"Load Balance", value:"LOADBALANCE"},
    {label:"Round Robin", value: "ROUNDROBIN"}
],

lagg_interfaces_placeholder : T('Lagg Interfaces'),
lagg_interfaces_tooltip : T('Select the interfaces to use in the aggregation.<br>\
 Warning: Lagg creation fails if any of the selected\
 interfaces have been manually configured.'),
lagg_interfaces_validation : [ Validators.required ],

mtu_placeholder: T('MTU'),
mtu_tooltip: T('Maximum Transmission Unit, the largest protocol data unit that can be communicated. The largest workable MTU size varies with network interfaces and equipment. *1500* and *9000* are standard Ethernet MTU sizes.'),
mtu_validation: [rangeValidator(68, 9000)],

alias_list_placeholder: T('Aliases'),
alias_list_label: T('Aliases')
}
