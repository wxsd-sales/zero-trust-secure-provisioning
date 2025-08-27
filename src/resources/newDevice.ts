import * as crypto from 'crypto';

const id = crypto.randomUUID();
const createdAt = new Date();

export const name = 'main';

export const version = '2';

export const fixed = {
  cfg: { retext: true } as const,
  sale: 1,
  cust: 1,
  cmpn: { bscl: 1, svcl: 0, fclt: false, frch: false, reg: true } as const,
  cmmt: false
} as const;

function createDeviceDetails(deviceDetails: Record<string, string>) {
  return Object.entries(deviceDetails).map(([key, value]) => {
    return {
      type: 'ColumnSet',
      spacing: 'None',
      columns: [
        {
          type: 'Column',
          width: 30,
          items: [{ type: 'TextBlock', text: key, wrap: true }]
        },
        {
          type: 'Column',
          width: 100,
          items: [{ type: 'TextBlock', text: value, wrap: true }]
        }
      ]
    };
  });
}


export default function newCard(deviceDetails: Record<string, string>) {
  const { ip, mac } = deviceDetails;
  return {
    contentType: 'application/vnd.microsoft.card.adaptive',
    content: {
      $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.3',
      body: [
        {
          type: 'Container',
          id: 'container-0',
          items: [
            {
              type: 'TextBlock',
              text: 'ZTP Service',
              wrap: true,
              size: 'ExtraLarge',
              weight: 'Bolder',
              color: 'Good'
            },
            {
              type: 'TextBlock',
              text: 'New RoomOS Device Detected',
              wrap: true
            },
            ...createDeviceDetails(deviceDetails)
          ]
        },
        {
          type: 'Container',
          id: 'container-1',
          minHeight: '25px',
          items: [
            {
              type: 'Input.Text',
              label: 'Workspace Name',
              id: 'workspaceName'
            },
            {
              type: 'TextBlock',
              text: 'Example: BLD01-Meeting Room',
              wrap: true,
              color: 'Accent',
              size: 'Small',
              isSubtle: true,
              weight: 'Lighter',
              spacing: 'Small'
            }
          ]
        }
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: 'Submit',
          style: 'positive',
          data: {
            ip,
            mac,
            _card: { id, name, ip, mac, version, createdAt: createdAt.getTime() },
            ...fixed
          }
        }
      ]
    }
  };
}
