import asTable from 'as-table';
import Papa from 'papaparse';
import { disclaimer } from '$resources/card';
import {
  constructHydraId,
  deconstructHydraId,
  webexSdk,
  webexSdkAttachmentActionsPlugin,
  webexSdkMessagesPlugin,
  webexSdkPeoplePlugin
} from '$lib/shared/webex-sdk';
import { taxLine } from '$lib/dtos';
import { jsonRequest } from '$lib/shared/request';
import type { JsonRequest } from '$lib/shared/request/json-request';
import type { Webex, WebexSdk } from '$lib/shared/webex-sdk/webex-sdk';
import type { Message as WebexMessage } from '$lib/shared/webex-sdk/webex-sdk-plugin-messages';
import type { AttachmentAction as WebexAttachmentAction } from '$lib/shared/webex-sdk/webex-sdk-plugin-attachment-actions';
import type { Logger } from '$lib/types/logger';
import Devices, { Device } from '$lib/types/device';
import * as jsxapi from 'jsxapi';

export class Bot {
  readonly webexBotPersonId: string;
  readonly webexPersonEmailRegex: RegExp;
  readonly webexSdk: WebexSdk;
  readonly iseHttpApi: JsonRequest;
  readonly log?: Logger;
  protected webex: any;
  protected devices: Devices = [];

  constructor(
    webex: { baseUrl: `${string}/`; botId: string; botToken: string; personEmailRegex: RegExp },
    ise: { baseUrl: `${string}/`; username: string; password: string; clientId: string; clientProfileId: string },
    log: Logger = console
  ) {
    const webexBotUuid = deconstructHydraId(webex.botId).id ?? webex.botId;
    const iseConfig = {
      ...ise,
      resource: 'api/v1',
      headers: [
        ['Authorization', 'Basic ' + Buffer.from(ise.username + ':' + ise.password).toString('base64')],
        ['client_id', ise.clientId.toString()],
        ['client_profile_id', ise.clientProfileId.toString()]
      ] satisfies [string, string][]
    };
    this.webexBotPersonId = constructHydraId('PEOPLE', webexBotUuid);
    this.webexPersonEmailRegex = webex.personEmailRegex;
    this.webexSdk = webexSdk(webex.botToken);
    this.iseHttpApi = jsonRequest(iseConfig);
    this.log = log;
  }

  provision(ip: string, mac: string) {
    const newDevice: Device = { ip, mac, state: 'new' };
    console.log('New Device:', newDevice);
    this.devices.push(newDevice);
    console.log(jsxapi)
    jsxapi.connect('wss://'+ip, {
      username: 'admin',
      password: '',
      })
      .on('error', console.error)
      .on('ready', async (xapi) => {
        const volume = await xapi.status.get('Audio Volume');
        console.log(`volume is: ${volume}`);
        xapi.close();
      });
        console.log('Devices:', this.devices)
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

    const isAuthorized = (emailRegex: RegExp, event: WebexMessage, webex: Webex) => {
      const { personEmail, personId } = event.data;

      return personEmail != null
        ? Promise.resolve(emailRegex.test(personEmail))
        : webexSdkPeoplePlugin.get(webex, personId).then((r) => emailRegex.test(r.emails[0]));
    };

    const sendMainCard = (toPersonId: string, webex: Webex) => {
      const module = import('$resources/card.js');

      return module
        .then((r) => ({ text: r.name, attachments: [r.card] }))
        .then((r) => {
          console.log(JSON.stringify(r));
          return r;
        })
        .then(({ text, attachments }) => webexSdkMessagesPlugin.create(webex, { toPersonId, text, attachments }));
    };

    const sendUnauthorizedMessage = async (toPersonId: string, webex: Webex) => {
      const text = 'Sorry, you are not authorized to use this bot.';

      return webexSdkMessagesPlugin.create(webex, { toPersonId, text });
    };

    return new Promise((resolve) =>
      event?.data?.roomType !== 'direct'
        ? resolve(sendAcknowledgementMessage(event.data.roomId, webex))
        : resolve(false)
    )
      .then(() => isAuthorized(this.webexPersonEmailRegex, event, webex))
      .then((r) =>
        r ? sendMainCard(event.data.personId, webex) : sendUnauthorizedMessage(event.data.personId, webex)
      );
  }

  protected onAttachmentActionCreate(event: WebexAttachmentAction, webex: Webex) {
    this.log?.info({ event }, this.onAttachmentActionCreate.name);

    if (event?.data?.personId === this.webexBotPersonId) {
      return Promise.resolve(false);
    }

    const deleteMessage = (messageId: string, webex: Webex) => webexSdkMessagesPlugin.delete(webex, messageId);

    const parseInput = (event: WebexAttachmentAction) => {
      const { cfg, cmpn, addr, city, st, zip, ctry, qty, cust, date, chg, line, sale, serv, tran, ref, cmmt } =
        event?.data?.inputs ?? {};
      const format = event?.data?.inputs?.format;
      const basis = serv === '21' && !isNaN(Number(line)) ? Math.ceil(Number(line) / 23).toString() : line;
      const bill = { addr, city, st, zip, ctry };
      const itms = [{ qty, chg, line: basis, sale, serv, tran, ref }];
      const inv = [{ bill, itms, cust, date }];

      return { cfg, cmpn, inv, cmmt, format };
    };

    const getTaxesFromAvalara = (body: unknown) =>
      this.iseHttpApi
        .post({ body })
        .then((r) => r.json())
        .then((r) => (r?.err != null || r?.inv?.err != null || r?.inv?.itms?.err != null ? Promise.reject(r) : r));

    const composeTaxes = (taxes: { [key: string]: unknown }[], format: 'table' | 'csv' | 'json' = 'table') => {
      switch (format) {
        case 'csv': {
          return ['```csv', Papa.unparse(taxes), '```'].join('\n');
        }
        case 'json': {
          return ['```json', JSON.stringify(taxes), '```'].join('\n');
        }
        case 'table':
        default: {
          const taxLines = taxes.map((r: { [key: string]: unknown }) => taxLine(r).toJSON());
          return ['```text', asTable(taxLines), '```'].join('\n');
        }
      }
    };

    const sendTaxMessage = (
      id: string,
      body: unknown,
      tax: string,
      format: 'table' | 'csv' | 'json',
      roomId: string,
      webex: Webex
    ) => {
      const link =
        '[Tax Result Reference]' +
        '(https://developer.avalara.com/communications/dev-guide_rest_v2/reference/detailed-tax-result/)';
      const markdown = [
        ['**UUID: ', id, '**'].join(''),
        [],
        ['**Request:**', '```json', JSON.stringify(body), '```'].join('\n'),
        [`**Response (${format}, see ${link}):**`, tax].join('\n'),
        [],
        [disclaimer]
      ].join('\n');

      return webexSdkMessagesPlugin.create(webex, { roomId, markdown });
    };

    const sendErrorMessage = (id: string, uuid: string, error: unknown, roomId: string, webex: Webex) => {
      const text = `An error occurred processing your request ${uuid}, you may try again.`;
      return webexSdkMessagesPlugin.create(webex, { roomId, text });
    };

    deleteMessage(event.data.messageId, webex)
      .then(() => {
        const { format, ...body } = parseInput(event);
        return getTaxesFromAvalara(body)
          .then((r) => composeTaxes(r?.inv?.[0]?.itms?.[0]?.txs ?? [], format))
          .then((r) => sendTaxMessage(event?.data.inputs._card.id, body, r, format, event.data.roomId, webex));
      })
      .catch((r) =>
        sendErrorMessage(event?.data?.id, event?.data.inputs._card.id, r, event.data.roomId, webex)
          .catch((e) => this.log?.trace(e))
          .finally(() => false)
      );
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
    this.webexSdk
      .initialize()
      .then((webex) => validateUuid(webex))
      .then((webex) => webexSdkMessagesPlugin.startListening(webex, onMessageCreate))
      .then((webex) => webexSdkAttachmentActionsPlugin.startListening(webex, onAttachmentActionCreate))
      .then((webex) => (this.webex = webex));
  }

  sendTest(toPersonEmail: string, text: string) {
    console.log('sending:', text, ' - To:', toPersonEmail, ' this webexsdk', this.webexSdk);
    return webexSdkMessagesPlugin.create(this.webex, { toPersonEmail, text });
  }
}

export const bot = (...args: ConstructorParameters<typeof Bot>) => new Bot(...args);

export default bot;
