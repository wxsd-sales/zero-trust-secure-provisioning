import fp from 'fastify-plugin';
import * as jsxapi from 'jsxapi';

export interface DeviceCheckOptions {
  ip: string;
  mac: string;
}

async function validateDevice(device: DeviceCheckOptions){
  console.log('Validating Device:', device)
  return new Promise((resolve, reject) => {
      jsxapi
      .connect('wss://' + device.ip, {
        username: 'admin',
        password: ''
      })
      .on('error', (error) => {
        const message = error?.message
        if(!message) return
        if (message.endsWith('403')) {
          reject('Default Credentials Not Authorized For Device IP:' + device.ip );
        } else if (message.includes('ETIMEDOUT')) {
          console.log('error timeout:', device.ip);
          reject('Connection Timeout: Could Not Conenct To Device IP:' + device.ip );
        }
      })
      .on('ready', async (xapi) => {
        const macAddres = await xapi.Status.Network[1].Ethernet.MacAddress.get();
        xapi.close();
        if (macAddres.toLowerCase() === device.mac.toLocaleLowerCase()) {
          resolve('Provisioning Started');
        } else {
          reject('Mismatched MAC Address');
        }
      });
      
      setTimeout(()=>{
        reject('Connection Timeout Test: Could Not Conenct To Device IP:' + device.ip );
      }, 5000)
  });
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<{ device: DeviceCheckOptions }>( async (fastify, opts) => {
  fastify.decorate('validateDevice', validateDevice);
});

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    validateDevice: typeof validateDevice;
  }
}