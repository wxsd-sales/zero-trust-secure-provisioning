import bot, { Bot } from './services/webexBot';
import { PXGRID_MONITOR } from './services/pxgridMonitor';
import { webexBotConfig, pxgridConfig, scepConfig, onboardingPassword } from '$lib/config';
import { workspaceIntegrationConfig } from '$lib/config';
import RoomOSControl from '$lib/roomosControl/roomos';
import WorkspaceIntegration from '$lib/workspaceIntegration';

async function init() {
  const roomOSControlConfig = {
    scep: scepConfig,
    defaultPassword: onboardingPassword
  };

  const prefix = 'zpt-service-init:';

  

  console.log(prefix, 'ZTP Service Starting');

  console.log(prefix, 'Starting Workspace Integration Service');
  const workspaceIntegration = new WorkspaceIntegration(workspaceIntegrationConfig);
  await workspaceIntegration.initialize();
  console.log(prefix, 'Workspace Integration Service Ready');


  const roomOSControl = new RoomOSControl({...roomOSControlConfig, workspaceIntegration});

  console.log(prefix, 'Starting Webex Bot Service');
  const webexBot = bot(webexBotConfig, roomOSControl);
  await webexBot.initialize();
  console.log(prefix, 'Webex Bot Service Ready');

  console.log(prefix, 'Starting PXGrid Monitor Service');
  const pxgrid = new PXGRID_MONITOR(pxgridConfig);

  console.log(prefix, 'PXGrid Monitor Started');

  pxgrid.monitor((message: any) => {
    const ip: string = message?.sessions?.[0]?.ipAddresses?.[0];
    const mac: string = message?.sessions?.[0].macAddress;
    if (!ip || !mac) return;
    const processDelaySeconds = 10;
    console.log('Will begin processing device [', ip,'] in [', processDelaySeconds, '] seconds' )
    setTimeout(()=>{processNewDevice(roomOSControl, webexBot, ip, mac)}, processDelaySeconds * 1000);
  });
}

async function processNewDevice(roomOSControl: RoomOSControl, webexBot: Bot, ip: string, mac: string) {
  const prefix = 'zpt-service: pxgrid-monitor:';

  const identifier = `Device IP[${ip}] MAC:[${mac}]`;
  console.info(prefix, 'New Message Event:', identifier);
  let status;
  try {
    console.info(prefix, 'Validating and Securing Device: IP:', identifier);
    status = await roomOSControl.validate({ ip }, mac);
    console.info('status:', status);
    if (!status || !status.ready) return;
  } catch (error) {
    console.error(prefix, 'Could Not Validate Device: IP:', identifier);
    console.error(error);
    return;
  }

  console.info(prefix, 'Validated and Secured Device: IP:', identifier);

  const { personEmail, teamId } = webexBotConfig;

  const systemUnit = status?.systemUnit;

  const serial = systemUnit?.Hardware.Module.SerialNumber ?? '';
  const model = systemUnit?.ProductType ?? '';
  const software = systemUnit?.Software.DisplayName ?? '';

  const deviceDetails = {
    ip,
    mac,
    serial,
    model,
    software
  };

  let newCard;

  if (teamId) newCard = await webexBot.sendTeamNewCard(teamId, deviceDetails);
  if (personEmail && !teamId) newCard = await webexBot.sendPersonNewCard(personEmail, deviceDetails);

  const link = 'webexteams://im?space=' + newCard;

  console.info(prefix, 'Space Link:', link, identifier);

  await roomOSControl.initialize({ ip }, link);
}

init();
