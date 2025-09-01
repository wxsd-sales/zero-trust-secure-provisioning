import * as crypto from 'crypto';
import { VALID_COUNTRY_CODE } from '$lib/constants/common';

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

export const disclaimer =
  'The information provided by Avalara Tax Bot ("we") is for general estimation purposes only. All information is ' +
  'provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding ' +
  'the accuracy, adequacy, validity, reliability, availability, or completeness of any information.';

export const card = {
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
            text: 'Avalara Tax Bot',
            wrap: true,
            size: 'ExtraLarge',
            weight: 'Bolder',
            color: 'Good'
          },
          {
            type: 'TextBlock',
            text:
              "This Webex Adaptive Card provides a way to interface with Avalara's communications tax engine API " +
              'for estimation purposes.',
            wrap: true
          },
          {
            type: 'ColumnSet',
            spacing: 'None',
            columns: [
              { type: 'Column', width: 30, items: [{ type: 'TextBlock', text: 'UUID', wrap: true }] },
              { type: 'Column', width: 100, items: [{ type: 'TextBlock', text: id, wrap: true }] }
            ]
          },
          {
            type: 'ColumnSet',
            spacing: 'None',
            columns: [
              { type: 'Column', width: 30, items: [{ type: 'TextBlock', text: 'Created At', wrap: true }] },
              { type: 'Column', width: 100, items: [{ type: 'TextBlock', text: createdAt.toISOString(), wrap: true }] }
            ]
          }
        ]
      },
      {
        type: 'Container',
        id: 'container-1',
        minHeight: '25px',
        items: [
          {
            type: 'Input.Text',
            label: 'Street Address',
            isMultiline: true,
            id: 'addr'
          },
          {
            type: 'TextBlock',
            text: 'Example: UNIVERSITY OF ILLINOIS CHICAGO 1200 W HARRISON ST STE 1800',
            wrap: true,
            color: 'Accent',
            size: 'Small',
            isSubtle: true,
            weight: 'Lighter',
            spacing: 'Small'
          },
          {
            type: 'Input.Text',
            label: 'City',
            id: 'city'
          },
          {
            type: 'TextBlock',
            text: 'Example: Chicago',
            wrap: true,
            color: 'Accent',
            size: 'Small',
            isSubtle: true,
            weight: 'Lighter',
            spacing: 'Small'
          },
          {
            type: 'Input.Text',
            label: 'State',
            id: 'st'
          },
          {
            type: 'TextBlock',
            text: 'Example: IL',
            wrap: true,
            color: 'Accent',
            size: 'Small',
            isSubtle: true,
            weight: 'Lighter',
            spacing: 'Small'
          },
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 70,
                items: [
                  {
                    type: 'Input.Text',
                    label: 'Zip Code',
                    id: 'zip'
                  },
                  {
                    type: 'TextBlock',
                    text: 'Example: 60607',
                    wrap: true,
                    color: 'Accent',
                    size: 'Small',
                    isSubtle: true,
                    weight: 'Lighter',
                    spacing: 'Small'
                  }
                ],
                id: 'column-1'
              },
              {
                type: 'Column',
                width: 30,
                items: [
                  {
                    type: 'Input.Text',
                    label: 'Country',
                    id: 'ctry',
                    value: 'USA',
                    isRequired: true,
                    errorMessage: 'Please provide a valid three-letter country Code.',
                    regex: VALID_COUNTRY_CODE.source
                  },
                  {
                    type: 'TextBlock',
                    text: 'Example: USA',
                    wrap: true,
                    color: 'Accent',
                    size: 'Small',
                    isSubtle: true,
                    weight: 'Lighter',
                    spacing: 'Small'
                  }
                ],
                id: 'column-2'
              }
            ],
            id: 'column-set-1'
          }
        ]
      },
      {
        type: 'Container',
        id: 'container-2',
        minHeight: '10px',
        items: [
          {
            type: 'Input.Date',
            label: 'Date of Transaction',
            isRequired: true,
            id: 'date',
            errorMessage: 'Please select a date.',
            value: new Date().toISOString().slice(0, 10)
          },
          {
            type: 'TextBlock',
            text: "The 'Date of Transaction' is the invoice date.",
            wrap: true,
            color: 'Accent',
            size: 'Small',
            isSubtle: true,
            weight: 'Lighter',
            spacing: 'Small'
          },
          {
            type: 'Input.Number',
            label: 'Quantity of Service',
            id: 'qty',
            value: 0,
            isRequired: true,
            min: 0
          },
          {
            type: 'TextBlock',
            text: "Taxation is equivalent to repeating the item the number of times of the 'Quantity of Service'.",
            wrap: true,
            color: 'Accent',
            size: 'Small',
            isSubtle: true,
            weight: 'Lighter',
            spacing: 'Small'
          },
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 35,
                items: [
                  {
                    type: 'Input.Number',
                    label: 'Charge Amount',
                    id: 'chg',
                    min: 0
                  }
                ]
              },
              {
                type: 'Column',
                width: 50,
                items: [
                  {
                    type: 'Input.Number',
                    label: 'Telephone Number Quantity',
                    id: 'line',
                    min: 0
                  }
                ]
              }
            ]
          },
          {
            type: 'TextBlock',
            text:
              "Provide 'Charge Amount' and 'Number of Lines' values if you choose '59, 21 — Telephone Number' " +
              'below.',
            wrap: true,
            color: 'Accent',
            size: 'Small',
            isSubtle: true,
            weight: 'Lighter',
            spacing: 'Small'
          },
          {
            type: 'Input.ChoiceSet',
            choices: [
              {
                title: '59, 6 — Calling Plan',
                value: '6'
              },
              {
                title: '59, 21 — Telephone Number',
                value: '21'
              },
              {
                title: '59, 51 — International Minutes',
                value: '51'
              }
            ],
            id: 'serv',
            value: '6',
            label: 'Service Type ID',
            isRequired: true,
            errorMessage: 'Please select an option.'
          },
          {
            type: 'TextBlock',
            text: "Current options include 'Calling Plan', 'Telephone Number', and 'International Minutes'.",
            wrap: true,
            color: 'Accent',
            size: 'Small',
            isSubtle: true,
            weight: 'Lighter',
            spacing: 'Small'
          },
          {
            type: 'Input.ChoiceSet',
            choices: [
              {
                title: '59 — VoIP-Nomadic',
                value: '59'
              }
            ],
            id: 'tran',
            value: '59',
            label: 'Transaction Type ID',
            isRequired: true,
            errorMessage: 'Please select an option.'
          },
          {
            type: 'TextBlock',
            text: "Current option is limited to 'VoIP-Nomadic'.",
            wrap: true,
            color: 'Accent',
            size: 'Small',
            isSubtle: true,
            weight: 'Lighter',
            spacing: 'Small'
          },
          {
            type: 'Input.Text',
            label: 'Reference Code',
            id: 'ref',
            value: id,
            isVisible: false,
            isRequired: true,
            errorMessage: 'Please provide a value.'
          }
        ]
      },
      {
        type: 'Container',
        id: 'container-3',
        minHeight: '10px',
        items: [
          {
            type: 'Input.ChoiceSet',
            choices: [
              {
                title: 'Tabular — ASCII table, most easy to read',
                value: 'table'
              },
              {
                title: 'CSV — Comma Separated values',
                value: 'csv'
              },
              {
                title: 'JSON — Unaltered API response body',
                value: 'json'
              }
            ],
            id: 'format',
            label: 'Response Format',
            value: 'table',
            isRequired: true,
            errorMessage: 'Please select an option.'
          },
          {
            type: 'TextBlock',
            text: "Current options include 'Tabular', 'CSV', 'JSON'.",
            wrap: true,
            color: 'Accent',
            size: 'Small',
            isSubtle: true,
            weight: 'Lighter',
            spacing: 'Small'
          },
          {
            type: 'TextBlock',
            text: disclaimer,
            wrap: true,
            spacing: 'large',
            fontType: 'small',
            size: 'small',
            weight: 'bolder',
            color: 'warning'
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
          _card: { id, name, version, createdAt: createdAt.getTime() },
          ...fixed
        }
      }
    ]
  }
};

export default card;