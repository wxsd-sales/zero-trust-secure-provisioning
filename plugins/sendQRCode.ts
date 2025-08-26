import fp from 'fastify-plugin';
import images from 'images';
import * as jsxapi from 'jsxapi';
import QRCode, { QRCodeToBufferOptions } from 'qrcode';
// import { Writable } from 'stream';

// import images from 'images';

export interface QRCodeTest {
  ip: string;
  qrcode: string;
  password: string;
}

const qrcodeOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['ip', 'spaceId', 'password'],
      additionalProperties: false,
      properties: {
        ip: { type: 'string' },
        spaceId: { type: 'string' },
        password: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          result: { type: 'string' }
        }
      }
    }
  }
};

async function saveBackground(device: QRCodeTest) {
  //console.log('Saving QR Code To Device:', device)
  console.log('Saving QR Code To Device:', device.ip);

  return new Promise((resolve, reject) => {
    jsxapi
      .connect('wss://' + device.ip, {
        username: 'admin',
        password: device.password
      })
      .on('error', (error) => {
        const message = error?.message;
        if (!message) return;
        if (message.endsWith('403')) {
          reject('Default Credentials Not Authorized For Device IP:' + device.ip);
        } else if (message.includes('ETIMEDOUT')) {
          console.log('error timeout:', device.ip);
          reject('Connection Timeout: Could Not Conenct To Device IP:' + device.ip);
        }
      })
      .on('ready', async (xapi) => {
        console.log('sending qr code');
        await xapi.Command.UserInterface.Branding.Upload(
          { CustomId: 'qrcode', Type: 'Background' },
          device.qrcode
        ).catch((error: typeof Error) => {
          console.log('error saving background:', error);
        });
        xapi.close();

        resolve('Images saved');
      });

    setTimeout(() => {
      reject('Connection Timeout Test: Could Not Conenct To Device IP:' + device.ip);
    }, 5000);
  });
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<{ device: QRCodeTest }>(async (fastify, opts) => {
  fastify.post<{ Body: { ip: string; spaceId: string; password: string } }>(
    '/qrcode',
    qrcodeOpts,
    async function (request, reply) {

      const body = request.body;
      
      const qrOptions: QRCodeToBufferOptions = { margin: 1, width: 1000 };
      const qrcodeBuffer = await QRCode.toBuffer(body.spaceId, qrOptions);
      const qrcodeImage = images(qrcodeBuffer);
      const template = images('./public/template.png');
      const x = (template.width() - (qrOptions?.width ?? 0)) / 2;
      const y = (template.height() - (qrOptions?.width ?? 0)) / 2;

      // Draw QR Code Image on Template and Encode as png image
      const newImage = template.draw(qrcodeImage, x, y).encode('png');
      const base64Background = newImage.toString('base64');

      try {
        await saveBackground({ qrcode: base64Background, ip: body.ip, password: body.password });
        reply.status(200).send({ result: base64Background });
      } catch (error) {
        reply.status(500).send({ error });
      }
    }
  );
});
