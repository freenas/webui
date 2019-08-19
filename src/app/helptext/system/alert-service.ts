import { T } from '../../translate-marker';

export default {
    name_placeholder: T('Name'),
    name_tooltip: T('Name of the new alert service.'),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('Unset to disable this service without deleting it.'),

    type_placeholder: T('Type'),
    type_tooltip: T('Choose an alert service to display options for that\
 service.'),

    level_placeholder: T('Level'),
    level_tooltip: T('Select the level of severity.'),

    AWSSNS_region_placeholder: T('AWS Region'),
    AWSSNS_region_tooltip: T('Enter the <a\
 href="https://docs.aws.amazon.com/sns/latest/dg/sms_supported-countries.html"\
 target="_blank">AWS account region</a>.'),

    AWSSNS_topic_arn_placeholder: T('ARN'),
    AWSSNS_topic_arn_tooltip: T('Topic <a\
 href="https://docs.aws.amazon.com/sns/latest/dg/CreateTopic.html"\
 target="_blank">Amazon Resource Name (ARN)</a> for\
 publishing. Example: <b>arn:aws:sns:us-west-2:111122223333:MyTopic</b>.'),

    AWSSNS_aws_access_key_id_placeholder: T('Key ID'),
    AWSSNS_aws_access_key_id_tooltip: T('Access Key ID for the linked AWS account.'),

    AWSSNS_aws_secret_access_key_placeholder: T('Secret Key'),
    AWSSNS_aws_secret_access_key_tooltip: T('Secret Access Key for the linked AWS account.'),

    Mail_email_placeholder: T('Email Address'),
    Mail_email_tooltip: T('Enter a valid email address to receive alerts from this system.'),


    HipChat_hfrom_placeholder: T('From'),
    HipChat_hfrom_tooltip: T('Enter a name to send alerts'),

    HipChat_cluster_name_placeholder: T('Cluster Name'),
    HipChat_cluster_name_tooltip: T('HipChat cluster name.'),

    HipChat_base_url_placeholder: T('URL'),
    HipChat_base_url_tooltip: T('HipChat base URL.'),

    HipChat_room_id_placeholder: T('Room'),
    HipChat_room_id_tooltip: T('Name of the room.'),

    HipChat_auth_token_placeholder: T('Auth Token'),
    HipChat_auth_token_tooltip: T('Enter or paste an Authentication token.'),

    InfluxDB_host_placeholder: T('Host'),
    InfluxDB_host_tooltip: T('Enter the <a\
 href="https://docs.influxdata.com/influxdb/v1.5/introduction/getting-started/"\
 target="_blank">InfluxDB</a> hostname.'),

    InfluxDB_username_placeholder: T('Username'),
    InfluxDB_username_tooltip: T('Username for this service.'),

    InfluxDB_password_placeholder: T('Password'),
    InfluxDB_password_tooltip: T('Enter password.'),

    InfluxDB_database_placeholder: T('Database'),
    InfluxDB_database_tooltip: T('Name of the InfluxDB database.'),

    InfluxDB_series_name_placeholder: T('Series'),
    InfluxDB_series_name_tooltip: T('InfluxDB time series name for collected points.'),

    Mattermost_cluster_name_placeholder: T('Cluster Name'),
    Mattermost_cluster_name_tooltip: T('Name of the <a\
 href="https://docs.mattermost.com/overview/index.html"\
 target="_blank">Mattermost</a> cluster to join.'),

    Mattermost_url_placeholder: T('Webhook URL'),
    Mattermost_url_tooltip: T('Enter or paste the <a\
 href="https://docs.mattermost.com/developer/webhooks-incoming.html"\
 target="_blank">incoming webhook</a> URL associated with\
 this service.'),

    Mattermost_username_placeholder: T('Username'),
    Mattermost_username_tooltip: T('Mattermost username.'),

    Mattermost_password_placeholder: T('Password'),
    Mattermost_password_tooltip: T('Mattermost password.'),

    Mattermost_team_placeholder: T('Team'),
    Mattermost_team_tooltip: T('Mattermost <a\
 href="https://docs.mattermost.com/help/getting-started/creating-teams.html"\
 target="_blank">team name</a>.'),

    Mattermost_channel_placeholder: T('Channel'),
    Mattermost_channel_tooltip: T('Name of the <a\
 href="https://docs.mattermost.com/help/getting-started/organizing-conversations.html#managing-channels"\
 target="_blank">channel</a> to receive notifications.\
 This overrides the default channel in the incoming\
 webhook settings.'),

    OpsGenie_cluster_name_placeholder: T('Cluster Name'),
    OpsGenie_cluster_name_tooltip: T('Name of the <a\
 href="https://docs.opsgenie.com/docs"\
 target="_blank">OpsGenie</a> cluster. Find the Cluster\
 Name by signing into the OpsGenie web interface and\
 going to Integrations/Configured Integrations. Click the\
 desired integration, Settings, and read the Name field.'),

    OpsGenie_api_key_placeholder: T('API Key'),
    OpsGenie_api_key_tooltip: T('Enter or paste the <a\
 href="https://docs.opsgenie.com/v1.0/docs/api-integration"\
 target="_blank">API key</a>. Find the API key by signing\
 into the OpsGenie web interface and going to\
 Integrations/Configured Integrations. Click the desired\
 integration, Settings, and read the API Key field.'),

    OpsGenie_api_url_placeholder: T('API URL'),
    OpsGenie_api_url_tooltip: T('Leave empty for default (<a href="https://api.opsgenie.com" target="_blank">OpsGenie API</a>)'),

    PagerDuty_service_key_placeholder: T('Service Key'),
    PagerDuty_service_key_tooltip: T('Enter or paste the "integration/service" key for this\
 system to access the <a\
 href="https://v2.developer.pagerduty.com/v2/docs/events-api"\
 target="_blank">PagerDuty API</a>.'),

    PagerDuty_client_name_placeholder: T('Client Name'),
    PagerDuty_client_name_tooltip: T('PagerDuty client name.'),

    Slack_cluster_name_placeholder: T('Cluster Name'),
    Slack_cluster_name_tooltip: T('Name of the cluster.'),

    Slack_url_placeholder: T('Webhook URL'),
    Slack_url_tooltip: T('Paste the <a\
 href="https://api.slack.com/incoming-webhooks"\
 target="_blank">incoming webhook</a> URL associated with\
 this service.'),

    Slack_channel_placeholder: T('Channel'),
    Slack_channel_tooltip: T('Slack channel name. The service will post all\
 messages to this channel.'),

    Slack_username_placeholder: T('Username'),
    Slack_username_tooltip: T('Slack username for this service.'),

    Slack_icon_url_placeholder: T('Icon URL'),
    Slack_icon_url_tooltip: T('URL to an image to use for notification icons.\
 This overrides the incoming webhook setting.'),

    SNMPTrap_host_placeholder: T('Hostname'),
    SNMPTrap_host_tooltip: T(''),

    SNMPTrap_port_placeholder: T('Port'),
    SNMPTrap_port_tooltip: T(''),

    SNMPTrap_v3_placeholder: T('SNMPv3 Security Model'),
    SNMPTrap_v3_tooltip: T(''),

    SNMPTrap_v3_username_placeholder: T('Username'),
    SNMPTrap_v3_username_tooltip: T(''),

    SNMPTrap_v3_authkey_placeholder: T('Secret authentication key'),
    SNMPTrap_v3_authkey_tooltip: T(''),

    SNMPTrap_v3_privkey_placeholder: T('Secret encryption key'),
    SNMPTrap_v3_privkey_tooltip: T(''),

    SNMPTrap_v3_authprotocol_placeholder: T('Authentication protocol'),
    SNMPTrap_v3_authprotocol_tooltip: T(''),

    SNMPTrap_v3_privprotocol_placeholder: T('Encryption protocol'),
    SNMPTrap_v3_privprotocol_tooltip: T(''),

    SNMPTrap_community_placeholder: T('SNMP Community'),
    SNMPTrap_community_tooltip: T(''),

    VictorOps_api_key_placeholder: T('API Key'),
    VictorOps_api_key_tooltip: T('Enter or paste the <a\
 href="https://help.victorops.com/knowledge-base/api/"\
 target="_blank">VictorOps API key</a>.'),

    VictorOps_routing_key_placeholder: T('Routing Key'),
    VictorOps_routing_key_tooltip: T('Enter or paste the <a\
 href="https://portal.victorops.com/public/api-docs.html#/Routing32Keys"\
 target="_blank">VictorOps routing key</a>.'),

}
