# ISE pxGrid Integration Setup Guide

This guide walks you through the process of creating an integration node called "ZTP Service" in Cisco Identity Services Engine (ISE) using the pxGrid REST API, storing the integration password, and activating the integration in the ISE pxGrid Client Control panel.

  	  

## Prerequisites

- Administrator access to Cisco ISE
- pxGrid services enabled on ISE
- Access to the ISE REST API (ensure your IP is whitelisted in ISE if required)
- An API client (such as Postman or curl)


  	  
# Steps

1. Create an Integration Node via the pxGrid REST API

   - Compose the API Request

      - Endpoint: https://<ISE_HOSTNAME_OR_IP>:9060/ers/config/pxgridintegration
      - Method: POST

      - Headers:

         - Content-Type: application/json
         - Accept: application/json
         - Authorization: Basic <base64-encoded-admin:password> (or use API credentials)
      
      - Payload Example:
         ```json
         {
            "PxgridIntegration": {
               "name": "ZTP Service"
            }
         }
         ```

2. Example using curl

   ```
   curl -k -u admin:ISE_PASSWORD \
   -H "Content-Type: application/json" \
   -H "Accept: application/json" \
   -X POST \
   https://<ISE_HOSTNAME_OR_IP>:9060/ers/config/pxgridintegration \
   -d '{"PxgridIntegration":{"name":"ZTP Service"}}'
   ```

   > Replace admin:ISE_PASSWORD with your ISE admin credentials.
   > Replace <ISE_HOSTNAME_OR_IP> with your ISE server address.

3. Store the Integration Password

   Response Example:
   ```json
   {
      "PxgridIntegration": {
         "name": "ZTP Service",
         "password": "auto-generated-integration-password"
      }
   }
      ```
   > Important: Store the returned password value securely. This is the secret you'll use for pxGrid client authentication.


  	 
## Activate the Integration in ISE pxGrid Client Control

1.	Log in to the Cisco ISE Admin Portal.
2.	Navigate to Administration > pxGrid Services > pxGrid Clients (or similar, depending on your version).
3.	Find the new integration node listed as "ZTP Service" in the pxGrid Clients list.
4.	Select the integration node and click Activate (or "Approve" depending on UI).
5.	Confirm the integration is now active and ready for use.
