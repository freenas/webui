import { T } from "app/translate-marker";
import globalHelptext from '../../helptext/global-helptext';

export const helptext_system_failover = {
  dialog_initiate_failover_title: T("Initiate Failover"),
  dialog_initiate_failover_message: T("A failover might cause temporary service interruption."),
  dialog_initiate_failover_checkbox: T(`Confirm`),
  dialog_initiate_cancel: T('Cancel'),
  dialog_initiate_action: T('Failover'),

  dialog_sync_to_peer_title: T("Sync to Peer"),
  dialog_sync_to_peer_message: T("Are you sure you want to sync to peer?"),

  dialog_sync_to_peer_checkbox: T(`Reboot standby ${globalHelptext.ctrlr}?`),
  dialog_button_ok: T('Proceed'),

  dialog_sync_from_peer_title: T("Sync from Peer"),
  dialog_sync_from_peer_message: T("Are you sure you want to sync from peer?"),

  snackbar_sync_from_peer_message_success: T("Sync from Peer: Success!"),
  snackbar_sync_from_peer_success_action: T("Ok"),

  snackbar_sync_to_peer_message_success: T("Sync to Peer: Success!"),
  snackbar_sync_to_peer_success_action: T("Ok"),

  disabled_placeholder: T('Disabled'),
  disabled_tooltip: T(''),

  master_placeholder: T('Master'),
  master_tooltip: T(''),

  timeout_placeholder: T('Timeout'),
  timeout_tooltip: T(''),

  master_dialog_title: T('Failover'),
  master_dialog_warning: T(`Forcing the other ${globalHelptext.ctrlr} to become active will require a failover with temporary service disruption.`)


};