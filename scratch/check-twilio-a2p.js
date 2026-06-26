import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;

console.log("Parsed Account SID:", accountSid ? `${accountSid.substring(0, 6)}...${accountSid.substring(accountSid.length - 4)} (len: ${accountSid.length})` : "undefined");
console.log("Parsed Auth Token:", authToken ? `${authToken.substring(0, 4)}...${authToken.substring(authToken.length - 4)} (len: ${authToken.length})` : "undefined");

if (!accountSid || !authToken) {
  console.error("Missing Twilio credentials in .env!");
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

async function run() {
  try {
    console.log("Fetching Account Details from Twilio...");
    const accountRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: { 'Authorization': authHeader }
    });
    
    if (!accountRes.ok) {
      const errText = await accountRes.text();
      throw new Error(`Failed to fetch account: ${accountRes.status} ${errText}`);
    }
    
    const accountData = await accountRes.json();
    console.log("Account Status:", accountData.status);
    console.log("Account Friendly Name:", accountData.friendly_name);
    
    console.log("Fetching Messaging Services from Twilio API...");
    const servicesRes = await fetch(`https://messaging.twilio.com/v1/Services`, {
      headers: { 'Authorization': authHeader }
    });
    
    if (!servicesRes.ok) {
      const errText = await servicesRes.text();
      throw new Error(`Failed to fetch services: ${servicesRes.status} ${errText}`);
    }
    
    const servicesData = await servicesRes.json();
    console.log(`Found ${servicesData.services?.length || 0} services.`);
    
    for (const service of servicesData.services || []) {
      console.log(`\n--- Service: ${service.friendly_name} (${service.sid}) ---`);
      
      console.log(`Fetching Usa2p Campaigns for service ${service.sid}...`);
      const complianceRes = await fetch(`https://messaging.twilio.com/v1/Services/${service.sid}/Compliance/Usa2p`, {
        headers: { 'Authorization': authHeader }
      });
      
      if (!complianceRes.ok) {
        console.error(`Failed to fetch USA2P for ${service.sid}: ${complianceRes.status} ${await complianceRes.text()}`);
        continue;
      }
      
      const complianceData = await complianceRes.json();
      console.log(`Found ${complianceData.campaigns?.length || 0} campaigns.`);
      
      for (const campaign of complianceData.campaigns || []) {
        console.log(JSON.stringify(campaign, null, 2));
      }
    }
  } catch (error) {
    console.error("Error running script:", error);
  }
}

run();
