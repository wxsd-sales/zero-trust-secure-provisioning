# Creating a Workspace Integration for Webex Control Hub with Workspace Creation and Activation Code Scopes

This guide explains how to create a workspace integration manifest JSON file named **"ZTP Service"** with the required scopes, upload it to Webex Control Hub, and activate the integration while securely storing the necessary credentials and activation code.

---

## Create the Workspace Integration Manifest JSON File

1. Create a JSON manifest file named `ztp-service-manifest.json` with the following characteristics:

   - **Name**: "ZTP Service"
   - **Id**: A random UUID (example provided)
   - **Scopes**: Include scopes for creating workspaces and generating activation codes
   - **Provisioning**: Set to manual provisioning

   ### Example Manifest JSON

   ```json
   {
      "name": "ZTP Service",
      "id": "<Integration - UUID>",
      "description": "Workspace integration for creating workspaces and generating activation codes",
      "provisioningType": "manual",
      "scopes": [
         "spark-admin:workspaces_write",
         "identity:placeonetimepassword_create"
      ]
   }
   ```

   > Replace the "Integration - UUID" value with a newly generated UUID for your integration.

   > The "scopes" array includes:
   > - **spark-admin:workspaces_write** — permission to create workspaces
   > - **identity:placeonetimepassword_create** — permission to generate activation codes for devices in workspaces.

---

## Upload Manifest, Store Credentials, and Activate Integration in Control Hub

1. Log in to Webex Control Hub

   Navigate to https://admin.webex.com.

   Sign in with your administrator credentials.

2. Upload the Manifest File

   1. In Control Hub, go to Settings > Integrations (or the relevant  -section for workspace integrations).

   2. Choose the option to Add Custom Integration or Upload Manifest.
   
   3. Upload the ztp-service-manifest.json file you created.
   
3. Store Client ID and Client Secret

   1. After uploading, Control Hub will generate a Client ID and Client Secret for your integration.

   2. Securely store these credentials as they are required for authentication in your projects.

4. Activate the Integration and Obtain Activation Code

   1. Activate the integration within Control Hub.
   2. Once activated, generate an activation code for your workspace devices.
   3. Store a copy of this activation code securely; it is required to activate devices.
   
   > Note that Activation Code expires after 24 hours so you must activate the integration before then. After that the Refresh Token stored within the Activation Code will have a renewable expiry of 90 days, every time you use the Refresh Token to create Access Tokens

---

## Decoding a Webex Workspace Activation JWT

This guide explains how to decode a Webex workspace activation JWT using https://www.jwt.io and extract key values for storage.

Steps to Decode the JWT:

1.	Obtain the Activation Code (JWT)

   - Retrieve your Webex workspace activation code (JWT). This is usually provided by your admin or through your integration workflow.

2.	Navigate to https://www.jwt.io

      - Open your browser and go to https://www.jwt.io.


3.	Paste the JWT

      - Copy the activation code (JWT).
      - Paste it into the Encoded field on the left side of the jwt.io page.

4.	Decode the JWT

   - The payload (decoded JSON) will automatically appear in the Decoded section on the right.
   - You do not need a secret to view the payload; it is just base64-decoded.

5.	Locate and Copy the Required Values

      Look for the following keys in the decoded JSON:

      - client_id
      - client_secret
      - refresh_token
      - base_url
      - app_url

      Example payload:

      ```json
      {
         "client_id": "YOUR_CLIENT_ID",
         "client_secret": "YOUR_CLIENT_SECRET",
         "refresh_token": "YOUR_REFRESH_TOKEN",
         "base_url": "https://api.ciscospark.com/v1/",
         "app_url": "https://webex.com/app"
      }
      ```

6.	Store the Values Securely

      - Record the values for future use in a secure manner (for example, in a password manager or an encrypted configuration file).