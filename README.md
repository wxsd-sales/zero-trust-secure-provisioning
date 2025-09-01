
# Zero Trust Secure Provisioning

This is an example Zero Trust Provisioning (ZTP) solution for Cisco Collaboration Devices. The goal of this solution is to reduce dependency on IT resources for Device first time setup by automating Secure Network Onboarding, Workspace Provisioning and Device Activation. This is acomblished by enabling trusted Users or Third Party installers with the abililty to self-provision their Device via a Webex Bot after scanning a QR Code which brings them to a space for that Devices setup.

## Overview

Once a new device has been connected to a corperate network and has been profiled by an ISE Service. The ISE is expected to move the device to an on-boarding VLAN and send the ZTP service a new device provisioning request including the devices IP and MAC Addresses. The ZTP service attempts to connect to the Device using default admin credentials using the provided IP and validates the MAC Address of the device. Once validated, an on-boarding process begins. Refer to the flow diagram below.


### Sequence Diagram

```mermaid
sequenceDiagram
    actor User as User or<br> Trusted Installer
    participant Device as Cisco<br>Collaboration Device
    participant ISE as Identity Service Engine
    participant ZTP as Custom ZTP Service
    participant Webex as Webex
    participant CA as Certificate Authority

    %% Initial connections
    ZTP->>ISE: Establish WebSocket STOMP connect via pxGrid
    ZTP->>Webex: Connect for new message events (Webex Bot)

    %% Device connection and profiling
    User->>Device: Connect device to network
    Device->>ISE: Detected on network
    ISE->>Device: Profile device, assign provisioning VLAN

    %% ZTP event reception and device check
    ISE-->>ZTP: Notify new device in provisioning VLAN (pxGrid)
    ZTP->>Device: Connect via default credentials, check status
    ZTP->>Device: Query Devics xStatus

    %% Webex Room and Adaptive Card
    alt New or Factory Reset Device
        
        ZTP->>Webex: Create new Messaging Space in Team (Create Room API)
        ZTP->>Webex: Send adaptive card to new space (device details, workspace name input)
        ZTP->>Device: Save custom wallpaper with QR code linking to Webex space
    end

    %% User interaction with adaptive card
    User->>Device: Scan QR code, open Webex space
    User->>Webex: Enter workspace name, submit on adaptive card

    %% Workspace creation and activation code
    Webex-->>ZTP: Notify attachment action (workspace name)
    ZTP->>Webex: Create Workspace (Workspaces API)
    Webex-->>ZTP: Return Workspace ID
    ZTP->>Webex: Generate Activation Code (API, Workspace ID)
    Webex-->>ZTP: Return Activation Code

    %% Device provisioning
    ZTP->>Device: Save activation macro with activation code
    ZTP->>Device: Save CA certificate
    ZTP->>Device: Send SCEP Enrollment xCommand
    Device->>CA: Certificate enrollment request (NDE Service)
    CA-->>Device: Return signed certificate

    %% 802.1X authentication setup
    ZTP->>Device: Set installed cert for 802.1X auth (xCommand)
    ZTP->>Device: Enable cert-based 802.1X auth (xconfig)
    ZTP->>Device: Enable 802.1X authentication (xconfig)
    ZTP->>Device: Save 'registration in process' wallpaper (xCommand)

    %% Device reboot and registration
    ZTP->>Device: Send reboot xCommand
    Device->>Device: Reboot, authenticate, join production VLAN
    Device->>Webex: Macro triggers Webex registration with activation code (xCommand)
    Device->>Webex: Register to Webex services
    Device->>Device: Macro cleans up config and self-erases
```


## Setup

### Prerequisites & Dependencies: 

#### Project Enviroment
- NodeJS (version 18.x )
- npm (usually comes with Node.js)

#### Network and Service Requirements
- Webex Org with Admin Access
- RoomOS Device
- Cisco C11XX Router
- Cisco 9XXX Series Switch
- Microsoft AD Certificate Authority

#### Integration Requirements:

- Webex Bot - [Setup Guide](/docs/webexBot.md)

    Required Details:

    - Bot Token
    - Bot ID
    - Bot Email
     
- Webex Team - [Setup Guide](/docs/teamSetup.md)

    Required Details: 

     - Team Id

- Webex Worksapce Integration - [Setup Guide](/docs/workspaceIntegration.md)
    
    Required Details: 

    - Client Id
    - Client Secret
    - Refresh Token
    - Base URL
    - App URL

- Identify Service Engine PxGrid - [Setup Guide](/docs/pxgrid.md)


<!-- GETTING STARTED -->

### Installation Steps:
1.	Clone the repository

    ```
    git clone https://github.com/wxsd-sales/zero-trust-secure-provisioning.git
    cd zero-trust-secure-provisioning
    ```
    
2.	Install dependencies
    ```
    npm install
    ```
3.  Create an environment file
    ```
    cp .env.example .env
    ```
    Open the .env file in your preferred editor and update any configuration values as needed.
4.	Start the service
    ```
    npm start
    ```
    
    
## Demo

<!-- Keep the following statement -->
*For more demos & PoCs like this, check out our [Webex Labs site](https://collabtoolbox.cisco.com/webex-labs).

## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.


## Disclaimer

 Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex use cases, but are not Official Cisco Webex Branded demos.


## Questions
Please contact the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=zero-trust-secure-provisioning) for questions. Or, if you're a Cisco internal employee, reach out to us on the Webex App via our bot (globalexpert@webex.bot). In the "Engagement Type" field, choose the "API/SDK Proof of Concept Integration Development" option to make sure you reach our team. 
