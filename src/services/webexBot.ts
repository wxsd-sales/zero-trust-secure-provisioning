import {
  constructHydraId,
  deconstructHydraId,
  webexSdk,
  webexSdkAttachmentActionsPlugin,
  webexSdkMessagesPlugin,
  webexSdkPeoplePlugin,
  webexSdkRoomsPlugin,
  webexSdkTeamsPlugin
} from '$lib/shared/webex-sdk';

import type { Webex, WebexSdk } from '$lib/shared/webex-sdk/webex-sdk';
import type { Message as WebexMessage } from '$lib/shared/webex-sdk/webex-sdk-plugin-messages';
import type { AttachmentAction as WebexAttachmentAction } from '$lib/shared/webex-sdk/webex-sdk-plugin-attachment-actions';
import type { Logger } from '$lib/types/logger';
import Devices from '$lib/types/device';
import newCard from '$resources/newDevice';
// import { activateDevice } from '$lib/device/activateDevice';
//import WorkspaceIntegration from '../lib/workspaceIntegration';
import RoomOSControl from '$lib/roomosControl/roomos';

export class Bot {
  readonly webexBotPersonId: string;
  readonly webexSdk: WebexSdk;
  //readonly iseHttpApi: JsonRequest;
  readonly log?: Logger;
  protected webex: any;
  protected devices: Devices = [];
  protected roomOSControl: RoomOSControl;

  constructor(
    webex: { baseUrl: string; botId: string; botToken: string },
    roomOSControl: RoomOSControl,
    log: Logger = console
  ) {
    const webexBotUuid = deconstructHydraId(webex.botId).id ?? webex.botId;
    this.webexBotPersonId = constructHydraId('PEOPLE', webexBotUuid);
    this.webexSdk = webexSdk(webex.botToken);
    //this.workspaceIntegration = workspaceIntegration;
    this.roomOSControl = roomOSControl;
    this.log = log;
  }

  protected onMessageCreate(event: WebexMessage, webex: Webex) {
    this.log?.info({ event }, this.onMessageCreate.name);

    if (event?.data?.personId === this.webexBotPersonId) {
      return Promise.resolve(false);
    }

    const sendAcknowledgementMessage = (roomId: string, webex: Webex) => {
      const text = 'Handling request details in 1-1!';

      return webexSdkMessagesPlugin.create(webex, { roomId, text });
    };

    

    // const isAuthorized = (emailRegex: RegExp, event: WebexMessage, webex: Webex) => {
    //   const { personEmail, personId } = event.data;

    //   return personEmail != null
    //     ? Promise.resolve(emailRegex.test(personEmail))
    //     : webexSdkPeoplePlugin.get(webex, personId).then((r) => emailRegex.test(r.emails[0]));
    // };

    // const sendMainCard = (toPersonId: string, webex: Webex) => {
    //   const module = import('$resources/card.js');

    //   return module
    //     .then((r) => ({ text: r.name, attachments: [r.card] }))
    //     .then(({ text, attachments }) => webexSdkMessagesPlugin.create(webex, { toPersonId, text, attachments }));
    // };

    const sendUnauthorizedMessage = async (toPersonId: string, webex: Webex) => {
      const text = 'Sorry, you are not authorized to use this bot.';

      return webexSdkMessagesPlugin.create(webex, { toPersonId, text });
    };

    return (
      new Promise((resolve) =>
        event?.data?.roomType !== 'direct'
          ? resolve(sendAcknowledgementMessage(event.data.roomId, webex))
          : resolve(false)
      )
        //.then(() => isAuthorized(this.webexPersonEmailRegex, event, webex))
        .then((r) =>
          r ? this.sendText(event.data.personId, 'Hi There') : sendUnauthorizedMessage(event.data.personId, webex)
        )
    );
  }

  protected async onAttachmentActionCreate(event: WebexAttachmentAction, webex: Webex) {
    this.log?.info({ event }, this.onAttachmentActionCreate.name);

    if (event?.data?.personId === this.webexBotPersonId) {
      return Promise.resolve(false);
    }

    const deleteMessage = (messageId: string, webex: Webex) => webexSdkMessagesPlugin.delete(webex, messageId);

    const parseInput = (event: WebexAttachmentAction) => {
      const { workspaceName, ip, mac } = event?.data?.inputs ?? {};
      console.log('Inputs', event?.data?.inputs);

      return { workspaceName, ip, mac };
    };

    const sendErrorMessage = (id: string, uuid: string, error: unknown, roomId: string, webex: Webex) => {
      const text = `An error occurred processing your request ${uuid}, you may try again.`;
      return webexSdkMessagesPlugin.create(webex, { roomId, text });
    };

    const sendActivatingMessage = ( roomId: string, webex: Webex, displayName: string, workspaceName: string) => {
      const text = `User [${displayName}] requested device onboard and activation using workspacename [${workspaceName}]`;
      this.log?.info('Sending Activating Message:', text);
      return webexSdkMessagesPlugin.create(webex, { roomId, text });
    };


    const getDisplayName = ( event: WebexMessage, webex: Webex) => {
      const { personId } = event.data;
      this.log?.info('Getting Display Name personId:', personId);
      return webexSdkPeoplePlugin.get(webex, personId).then((r) => r.displayName);
    };


    const { workspaceName, ip } = parseInput(event);

    try{
      await deleteMessage(event.data.messageId, webex)
    } catch(error){
      this.log?.error('Unable to delete messageId:', event.data.messageId);
      return
    }
    

    const displayName = await getDisplayName(event, webex);

    await sendActivatingMessage(event.data.roomId, webex, displayName, workspaceName)
   


    try {
      this.log?.info('Activating Device with Workspace Name [',workspaceName,']');
      await this.roomOSControl.activate({ ip }, workspaceName);
    } catch (error) {
      sendErrorMessage(event?.data?.id, event?.data.inputs._card.id, error, event.data.roomId, webex)
          .catch((e) => this.log?.trace(e))
          .finally(() => false)
   
      this.log?.error('Error Activating Device: IP [',ip,']');
      throw error;
    }

    

    // deleteMessage(event.data.messageId, webex)
    //   .then(async () => {
    //     const { workspaceName, ip } = parseInput(event);

    //     try {
    //       console.log('Activating', ip, 'with workspacename', workspaceName);
    //       await this.roomOSControl.activate({ ip }, workspaceName);
    //     } catch (error) {
    //       console.log('Error Activating Device', ip);
    //       console.log(error);
    //       throw error;
    //     }
        
    //   })
    //   .catch((r) =>
    //     sendErrorMessage(event?.data?.id, event?.data.inputs._card.id, r, event.data.roomId, webex)
    //       .catch((e) => this.log?.trace(e))
    //       .finally(() => false)
    //   );
  }

  protected validateUuid(webex: Webex) {
    return webexSdkPeoplePlugin.get(webex, 'me').then((r) => {
      return r.id === this.webexBotPersonId ? Promise.resolve(webex) : Promise.reject('Bot Id mismatch');
    });
  }

  initialize({
    validateUuid = this.validateUuid.bind(this),
    onMessageCreate = this.onMessageCreate.bind(this),
    onAttachmentActionCreate = this.onAttachmentActionCreate.bind(this)
  } = {}) {
    return this.webexSdk
      .initialize()
      .then((webex) => validateUuid(webex))
      .then((webex) => webexSdkMessagesPlugin.startListening(webex, onMessageCreate))
      .then((webex) => webexSdkAttachmentActionsPlugin.startListening(webex, onAttachmentActionCreate))
      .then((webex) => (this.webex = webex));
  }

  sendText(toPersonEmail: string, text: string) {
    console.log('sending:', text, ' - To:', toPersonEmail);
    return webexSdkMessagesPlugin.create(this.webex, { toPersonEmail, text });
  }

  createNewRoom(teamId: string) {
    return webexSdkRoomsPlugin.create(this.webex, { teamId });
  }

  async sendTeamNewCard(teamId: string, deviceDetails: Record<string, string>) {
    //const messageResult = await webexSdkMessagesPlugin.list(this.webex, {})

    const teamsResult = await webexSdkTeamsPlugin.list(this.webex);

    console.log('teamsResult', JSON.stringify(teamsResult));

    const card = newCard(deviceDetails);
    console.log('Create New Team Room - TeamId:', teamId);

    const { model = 'N/A', ip = 'N/A', serial = 'N/A' } = deviceDetails;

    const roomTitle = `New Device - Model: ${model} IP:${ip} Serial: ${serial}`;

    try {
      const room = await webexSdkRoomsPlugin.create(this.webex, { teamId, title: roomTitle });
      console.log('Create New Team Room :', room);
      const { id } = room;
      if (!id) return;
      console.log('Sending New Device Card', card);
      await webexSdkMessagesPlugin.create(this.webex, { roomId: id, text: 'new device', attachments: [card] });
      return deconstructHydraId(id).id;
    } catch (error) {
      console.log('Create Teams card error', error);
    }
  }

  async sendPersonNewCard(personEmail: string, deviceDetails: Record<string, string>) {
    const card = newCard(deviceDetails);

    console.log('Sending New Device Card', card);
    return webexSdkMessagesPlugin.create(this.webex, { personEmail, text: 'new device', attachments: [card] });
  }

  async listTeams() {
    return await webexSdkTeamsPlugin.list(this.webex, {});
  }
}

export const bot = (...args: ConstructorParameters<typeof Bot>) => new Bot(...args);

export default bot;