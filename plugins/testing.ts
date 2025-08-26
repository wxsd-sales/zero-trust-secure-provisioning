import fp from 'fastify-plugin';
//import * as jsxapi from 'jsxapi';
import QRCode, { QRCodeToBufferOptions } from 'qrcode';
// import { Writable } from 'stream';

import images from 'images';

export interface QRCodeTest {
  ip: string;
  qrcode: string;
  password: string;
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<{ device: QRCodeTest }>(async (fastify, opts) => {
  fastify.get('/testing', async function (request, reply) {
      
    
      const options: QRCodeToBufferOptions = {
        margin: 1,
        width: 1000
      };
      try {
  
        // Create QR Code For Space Link
        const qrcodeBuffer = await QRCode.toBuffer('webexteams://im?space=6d66eda0-2a5a-11ef-989d-37c27fde37bf', options)
        const qrcodeImage = images(qrcodeBuffer);

        // Load Template Image
        const template = images('./public/template.png');


        // Template Image: Width 3840 - Height: 2160
        // Center QR Code position
        const x = (3840 - (options?.width ?? 0))/2;
        const y = (2160 - (options?.width ?? 0))/2;

        // Draw QR Code Image on Template and Encode as png image
        const newImage = template.draw(qrcodeImage, x, y).encode("png");

        const base64Background = newImage.toString('base64')


        reply.type('text/html')
        const html = `
        <html>
        <head>
        </head>
        <body>
         <img src=\"data:image/png;base64,${base64Background}\" style=\"max-height: 100%; max-width: 100%\">
        </body>
        </html>
        `
        reply.status(200).send(html);
      } catch (error) {
        reply.status(500).send({ error });
      }

    }
  );
});
