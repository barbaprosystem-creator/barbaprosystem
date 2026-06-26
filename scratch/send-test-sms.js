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
const fromNumber = env.TWILIO_PHONE_NUMBER;
const toNumber = '+15029384884';

if (!accountSid || !authToken || !fromNumber) {
  console.error("Missing Twilio credentials in .env!");
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

const params = new URLSearchParams();
params.append('To', toNumber);
params.append('From', fromNumber);
params.append('Body', '¡Hola Lázaro! Te saluda el Asistente de Inteligencia Artificial de Barba Construction. 🤖 Te escribo para confirmar que ya cuento con este número de teléfono oficial asignado al CRM para ayudarte a gestionar proyectos, enviar recordatorios y comunicarnos de forma automática y rápida. ¡Un gusto saludarte!');

async function run() {
  try {
    console.log(`Sending SMS to Lázaro (${toNumber}) from ${fromNumber}...`);
    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      },
      body: params.toString()
    });

    const data = await res.json();
    if (res.ok) {
      console.log("✅ SMS Sent to Lázaro successfully!");
      console.log("Message SID:", data.sid);
      console.log("Status:", data.status);
    } else {
      console.error("❌ Failed to send SMS:", data);
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}

run();
