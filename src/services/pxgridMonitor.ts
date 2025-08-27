import PXGRID from '$lib/pxgrid/pxgrid';
import WebSocketStomp from '$lib/pxgrid/websocketStomp';
// import * as hm from 'typed-rest-client/Handlers'
// import * as httpm from 'typed-rest-client/HttpClient';
// import sslChecker from "ssl-checker";

type PXGRID_MONITOR_CONFIG = {
  hostname: string;
  nodename: string;
  password?: string;
  serverCert: string;
};
export class PXGRID_MONITOR {
  readonly pxgridHostname: string;
  readonly pxgridNodename: string;
  protected pxgridPassword: string | undefined;
  readonly pxgridServerCert: string;

  constructor(config: PXGRID_MONITOR_CONFIG) {
    this.pxgridHostname = config.hostname;
    this.pxgridNodename = config.nodename;
    this.pxgridPassword = config.password;
    this.pxgridServerCert = config.serverCert;
  }

  async initialize() {
    const pxgrid = new PXGRID({
      hostname: this.pxgridHostname,
      nodeName: this.pxgridNodename,
      password: this.pxgridPassword,
      serverCert: this.pxgridServerCert,
      description: 'testing'
    });

    if (!this.pxgridPassword) {
      const accountCreate = await pxgrid.accountCreate();

      if (!accountCreate) {
        console.log('Account create error');
        return;
      }

      this.pxgridPassword = accountCreate.password;

      console.log('Account Created:', this.pxgridPassword);
    } else {
      console.log('Using password', this.pxgridPassword);
    }

    let activated = false;

    while (!activated) {
      const activateResult = await pxgrid.accountActivate(this.pxgridPassword);
      console.log('activate status', activateResult);
      if (activateResult?.accountState != 'ENABLED') {
        await sleep(15000);
      } else {
        activated = true;
      }
    }

    // Lookup session service
    const sessionLookup = await pxgrid.serviceLookup('com.cisco.ise.session');
    if (!sessionLookup) return;
    console.log('Service Lookup Response', JSON.stringify(sessionLookup));

    const service = sessionLookup.services[0];

    const pubSubServiceName = service.properties.wsPubsubService;
    const topic = service.properties.sessionTopic;

    console.log('pubSubServiceName:', pubSubServiceName);
    console.log('topic:', topic);

    // Lookup pubsub services
    const pubSubLookup = await pxgrid.serviceLookup(pubSubServiceName);
    if (!pubSubLookup) return;
    const pubSubService = pubSubLookup.services[0];
    console.log('pubSubService:', JSON.stringify(pubSubService));
    const pubSubNodeName = pubSubService.nodeName;

    const wsUrl = pubSubService.properties?.wsUrl;

    console.log('wsUrl:', wsUrl);

    if (!wsUrl) return;
    const secretResponse = await pxgrid.getAccessSecret(pubSubNodeName);

    if (!secretResponse) return;

    const secret = secretResponse.secret;

    console.log('secret:', secret);

    const stomp = new WebSocketStomp(wsUrl, this.pxgridNodename, secret);
    await stomp.connect(pubSubNodeName);
    stomp.onMessage((message) => console.log('message call received', message));

    stomp.subscribe(topic);
  }

  async monitor(callback: CallableFunction) {
    console.log('PXGRID Monitor Starting');
    if (!this.pxgridPassword) return;
    const stomp = new WebSocketStomp(
      'wss://ise.dcloud.cisco.com:8910/pxgrid/ise/pubsub',
      this.pxgridNodename,
      this.pxgridPassword
    );
    stomp.onMessage((message: any) => {
      console.log(JSON.stringify(message));

      const profile = message?.sessions?.[0]?.selectedAuthzProfiles?.[0];
      const state = message?.sessions?.[0]?.state;
      console.log('Profile', profile);
      if (!profile || typeof profile != 'string') return;
      if (!state || typeof state != 'string') return;

      if (profile != 'Cisco_Video_Device_Onboarding') return;
      if (state != 'STARTED') return;
      
      callback(message);
    });

    await stomp.connect('~ise-pubsub-ise');
    stomp.subscribe('/topic/com.cisco.ise.session', 'state:started');
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
