import fp from 'fastify-plugin';

import * as jsxapi from 'jsxapi';

// import { Writable } from 'stream';

// import images from 'images';

export interface DeviceActivation {
  ip: string;
  username: string;
  password: string;
  activationCode: string;
  cert: string;
  scep: {
    url: string;
    fingerprint: string;
    commonName: string;
    challengePassword: string;
  };
}

const activateDeviceOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['ip', 'username', 'password', 'activationCode', 'cert'],
      additionalProperties: false,
      properties: {
        ip: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
        activationCode: { type: 'string' },
        cert: { type: 'string' },
        scep: { type: 'object' }
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

async function activateDevice(deviceActivation: DeviceActivation) {
  //console.log('Saving QR Code To Device:', device)
  console.log('Activation Device:', deviceActivation.ip);

  const { ip, username, password } = deviceActivation;

  return new Promise((resolve, reject) => {
    jsxapi
      .connect('wss://' + ip, {
        username: username,
        password: password
      })
      .on('error', (error) => {
        const message = error?.message;
        if (!message) return;
        if (message.endsWith('403')) {
          reject('Default Credentials Not Authorized For Device IP:' + ip);
        } else if (message.includes('TIMEDOUT')) {
          console.log('error timeout:', ip);
          reject('Connection Timeout: Could Not Conenct To Device IP:' + ip);
        }
      })
      .on('ready', async (xapi) => {
        console.log('Saving Activation Macro');
        console.log('Savign Cert', deviceActivation.cert);
        const certSave = await xapi.Command.Security.Certificates.CA.Add({}, deviceActivation.cert);

        console.log('certSave', certSave);
        const scep = deviceActivation.scep;

        const scepResult = await xapi.Command.Security.Certificates.Services.Enrollment.SCEP.Request({
          URL: scep.url,
          FingerPrint: scep.fingerprint,
          CommonName: scep.commonName,
          ChallengePassword: scep.challengePassword
        });

        const certFingerprint = scepResult?.CertFingerprint;

        console.log('result', scepResult);

        const activateCert = await xapi.Command.Security.Certificates.Services.Activate({
          Fingerprint: certFingerprint,
          Purpose: '802.1X'
        });
        console.log('ActivateCert', activateCert);
        //const fingerPrint = scepResult?.fingerPrint;

        await xapi.Config.Network[1].IEEE8021X.UseClientCertificate.set('On');
        await xapi.Config.Network[1].IEEE8021X.Mode.set('On');

        console.log('Restarting RoomOS Device');
        await xapi.Command.SystemUnit.Boot({ Action: 'Restart', Force: 'True' });

        xapi.close();

        resolve('Images saved');
      });

    setTimeout(() => {
      reject('Connection Timeout Test: Could Not Conenct To Device IP:' + deviceActivation.ip);
    }, 30000);
  });
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<{ device: DeviceActivation }>(async (fastify, opts) => {
  fastify.post<{ Body: DeviceActivation }>('/activateDevice', activateDeviceOpts, async function (request, reply) {
    const body = request.body;

    console.log('body', body);
    try {
      await activateDevice(body);
      reply.status(200).send({ result: 'activatingDevice' });
    } catch (error) {
      console.log('error', error);
      reply.status(500).send({ error: error });
    }
  });
});
