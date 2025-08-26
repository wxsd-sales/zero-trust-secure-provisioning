# Setting Up the Webex Team for ZTP Project

This guide provides step-by-step instructions to create a Webex team named **"ZTP Setup Team"**, make it moderated, add a Webex bot as a moderator, and obtain and store the team ID for your project.

---

## Prerequisites
- Access to the Webex App or Webex web interface
- Webex bot email - eg: `myZtpBot@webex.bot`
- Webex developer account for API access (optional for automation)
- Appropriate permissions to create teams and manage memberships

---

## Step 1: Create the "ZTP Setup Team"

1. Open the Webex App or go to the Webex web interface.
2. Navigate to the **Teams** section.
3. Click **Create a team**.
4. Enter the team name:  
   `ZTP Setup Team`
5. (Optional) Add a description for the team.
6. Click **Create** to finalize the team creation.

> When you create a team, you become the **Team Moderator** by default.

---


## Step 2: Add the Webex Bot as a Moderator of the Team

1. Add the bot to the team by inviting it using its email address:  
   `myZtpBot@webex.bot`
2. Use the Webex Developer API to promote the bot to a moderator role in the team space.


## Step 3: Obtain and Store the Team ID

To get the team ID for the "ZTP Setup Team":

1. Use the Webex API endpoint to list teams:  
   `GET https://webexapis.com/v1/teams`
2. Find the room with the name **"ZTP Setup Team"** in the response.
3. Copy the `id` field value for that room — this is your **Team ID**.

Store this Team ID securely for use in your project or automation scripts.