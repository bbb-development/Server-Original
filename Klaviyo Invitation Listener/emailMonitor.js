import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
import Imap from "imap";
import * as cheerio from "cheerio";
import { simpleParser } from "mailparser";
import envConfig from "./envConfig.js";
import axios from "axios";
import fs from "fs/promises";
import { createClient } from "@supabase/supabase-js";
import Fuse from "fuse.js";

// Klaviyo email constants
const KLAVIYO_SENDER_EMAIL = "no-reply@klaviyo.com";
const KLAVIYO_INVITATION_SUBJECT = "New Klaviyo Account Invitation";

// Server configuration
const SERVER_BASE = 'http://138.68.69.38:3001';

// Supabase configuration
const supabase = createClient(envConfig.supabaseUrl, envConfig.supabaseServiceRoleKey);

const logAll = false;

class EmailMonitor {
  constructor() {
    this.imap = new Imap({
      user: envConfig.imapUser,
      password: envConfig.imapPass,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.imap.once("ready", this.onReady.bind(this));
    this.imap.once("error", this.onError.bind(this));
    this.imap.once("end", this.onEnd.bind(this));
  }

  onReady() {
    this.openInbox((err, box) => {
      if (err) {
        console.error("Error opening inbox:", err);
        return;
      }

      //console.log("📧 Email monitor started - listening for Klaviyo invitations...");
      console.log(`📮 Monitoring inbox: ${envConfig.imapUser}`);

      this.imap.on("mail", this.onNewMail.bind(this, box));
    });
  }

  onError(err) {
    console.error("❌ IMAP connection error:", err);
  }

  onEnd() {
    console.log("📪 IMAP connection ended");
  }

  openInbox(callback) {
    this.imap.openBox("INBOX", false, callback);
  }

  onNewMail(box, numNewMsgs) {
    //console.log(`\n📬 ${numNewMsgs} new message(s) received`);

    const fetch = this.imap.seq.fetch(
      `${box.messages.total - numNewMsgs + 1}:${box.messages.total}`,
      {
        bodies: "",
        markSeen: true,
      }
    );

    fetch.on("message", this.processMessage.bind(this));

    fetch.once("error", (err) => {
      console.error("❌ Fetch error:", err);
    });

    fetch.once("end", () => {
      //console.log("✅ Done processing new messages");
    });
  }

  processMessage(msg, seqno) {
    msg.on("body", (stream) => {
      simpleParser(stream, (err, parsed) => {
        if (err) {
          console.error("❌ Error parsing email:", err);
          return;
        }

        this.handleParsedEmail(parsed);
      });
    });
  }

  handleParsedEmail(parsed) {
    // Extract email details
    const fromEmail = this.extractEmailAddress(parsed.from?.text || "");
    const subject = parsed.subject || "";
    const toEmail = parsed.to?.text || "";

    // Log email details for debugging
    if (logAll) {
    console.log(`\n📨 Processing email:`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   To: ${toEmail}`);
    }

    // Check if this is a Klaviyo invitation
    if (!this.isKlaviyoInvitation(fromEmail, subject, toEmail)) {
      if (logAll) {
        console.log("   ⏭️  Not a Klaviyo invitation - skipping");
      }
      return;
    }

    // Extract brand name from email content
    const brandName = this.extractBrandName(parsed.text || parsed.html);
    if (brandName) {
      console.log(`🎯 KLAVIYO INVITATION DETECTED FROM BRAND: ${brandName}`);
    }

    // Extract invitation link
    const invitationLink = this.extractInvitationLink(parsed.html);
    
        if (invitationLink) {
      console.log("🔗 INVITATION LINK EXTRACTED:");
      console.log(`   ${invitationLink}`);
      if (logAll) {
        console.log(`   📧 Target email: ${toEmail}`);
        console.log(`   📅 Received: ${new Date().toISOString()}`);
      }
      
      // Automatically accept the invitation
      this.acceptInvitation(invitationLink, brandName, toEmail);
    } else {
      console.log("❌ Failed to extract invitation link from email");
    }
  }

  extractEmailAddress(fromText) {
    // Remove quotes and extract email from "Name" <email@domain.com> format
    return fromText.replace(/^".*?" </, "").replace(/>$/, "");
  }

  isKlaviyoInvitation(fromEmail, subject, toEmail) {
    // Check sender email
    if (fromEmail !== KLAVIYO_SENDER_EMAIL) {
      return false;
    }

    // Check subject
    if (subject !== KLAVIYO_INVITATION_SUBJECT) {
      return false;
    }

    return true;
  }

  extractBrandName(content) {
    if (!content) {
      return null;
    }

    try {
      // Look for the pattern "Klaviyo account (BRAND NAME)"
      const brandMatch = content.match(/Klaviyo account \(([^)]+)\)/i);
      
      if (brandMatch && brandMatch[1]) {
        return brandMatch[1].trim();
      }
      
      return null;
    } catch (error) {
      console.error("❌ Error extracting brand name:", error);
      return null;
    }
  }

  async acceptInvitation(invitationLink, brandName, targetEmail) {
    try {
      console.log("🚀 ATTEMPTING TO ACCEPT INVITATION...");
      
      const response = await fetch(`${SERVER_BASE}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'POST',
          url: invitationLink,
          timeout: 30000
        })
      });

      const fetchResult = await response.text();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Run both profile and company info requests concurrently
      const [profile, companyInfo] = await Promise.all([
        getProfile(),
        getCompanyInfo()
      ]);

      if (profile.company_name === brandName) {
        console.log("✅ INVITATION ACCEPTED SUCCESSFULLY!");
        console.log(`   🏢 Brand: ${brandName || 'Unknown'}`);
        
        // Save client information to clients.json
        await saveClientInfo(profile.company_name, profile.company_id, companyInfo);
        
        // Match with Supabase users and update their Klaviyo connection status
        await matchAndUpdateSupabaseUsers(profile.company_name, profile.company_id);
      } else {
        console.log("❌ INVITATION ACCEPTANCE FAILED - BRAND NAME MISMATCH");
      }
      
      if (logAll) {
        console.log("📋 Server response:", fetchResult);
      }
      
    } catch (error) {
      console.error("❌ FAILED TO ACCEPT INVITATION:");
      console.error(`   🏢 Brand: ${brandName || 'Unknown'}`);
      console.error(`   📧 Email: ${targetEmail}`);
      console.error(`   🔗 Link: ${invitationLink}`);
      
      const status = error.response?.status || 'ERR';
      const errorData = error.response?.data || error.message;
      console.error(`   ❌ [${status}] ${errorData}`);
    }
  }

  extractInvitationLink(htmlContent) {
    if (!htmlContent) {
      console.log("   ⚠️  No HTML content found in email");
      return null;
    }

    try {
      const $ = cheerio.load(htmlContent);
      
      // Find the "Accept" link
      const acceptLink = $("a")
        .filter(function () {
          return $(this).text().trim() === "Accept";
        })
        .attr("href");

      return acceptLink || null;
    } catch (error) {
      console.error("❌ Error parsing HTML content:", error);
      return null;
    }
  }

  start() {
    console.log("🚀 Starting Email Monitor...");
    //console.log(`📧 Connecting to: ${envConfig.imapUser}`);
    this.imap.connect();
  }

  stop() {
    console.log("🛑 Stopping Email Monitor...");
    this.imap.end();
  }
}

async function matchAndUpdateSupabaseUsers(clientName, clientId) {
  try {
    console.log(`🔍 Checking for Supabase user matches with client: ${clientName}`);
    
    // Fetch email sequences from Supabase where is_klaviyo_connected = false
    const { data: sequences, error } = await supabase
      .from('email_sequences')
      .select('id, klaviyo_brand_name')
      .eq('is_klaviyo_connected', false)
      .not('klaviyo_brand_name', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching email sequences from Supabase:', error.message);
      return;
    }
    
    if (!sequences || sequences.length === 0) {
      console.log('📋 No email sequences with is_klaviyo_connected=false found in Supabase');
      return;
    }
    
    console.log(`📋 Found ${sequences.length} email sequences to check for matches`);
    
    // Create fuzzy search instance with sequence brand names
    const sequenceBrandNames = sequences.map(sequence => ({
      name: sequence.klaviyo_brand_name,
      sequenceId: sequence.id
    }));
    
    const fuse = new Fuse(sequenceBrandNames, {
      keys: ['name'],
      threshold: 0.2, // 80% similarity (lower threshold = more strict)
      includeScore: true
    });
    
    // Search for the best match
    const searchResults = fuse.search(clientName);
    
    if (searchResults.length > 0 && searchResults[0].score <= 0.2) {
      const bestMatch = searchResults[0].item;
      const similarity = Math.round((1 - searchResults[0].score) * 100);
      
      console.log(`🎯 MATCH FOUND (${similarity}% similarity):`);
      console.log(`   📧 Sequence: ${bestMatch.name}`);
      console.log(`   🏢 Client: ${clientName}`);
      console.log(`   🆔 Client ID: ${clientId}`);
      
      // Update the matched email sequence's is_klaviyo_connected to true and set klaviyo_id
      const { error: updateError } = await supabase
        .from('email_sequences')
        .update({ 
          is_klaviyo_connected: true,
          klaviyo_id: clientId 
        })
        .eq('id', bestMatch.sequenceId);
      
      if (updateError) {
        console.error(`❌ Error updating email sequence ${bestMatch.sequenceId}:`, updateError.message);
      } else {
        console.log(`✅ Updated email sequence ${bestMatch.sequenceId}:`);
        console.log(`   - is_klaviyo_connected set to true`);
        console.log(`   - klaviyo_id set to ${clientId}`);
      }
    } else {
      console.log(`❌ No matching email sequence found for client: ${clientName}`);
    }
    
  } catch (error) {
    console.error('❌ Error in matchAndUpdateSupabaseUsers:', error.message);
  }
}

async function saveClientInfo(companyName, companyId, companyInfo) {
  try {
    const clientsFilePath = path.join(process.cwd(), 'clients.json');
    
    // Read existing clients or create empty array
    let clients = [];
    try {
      const fileContent = await fs.readFile(clientsFilePath, 'utf8');
      clients = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
      console.log('📝 Creating new clients.json file...');
    }
    
    // Check if client already exists
    const existingClient = clients.find(client => client.company_id === companyId);
    if (existingClient) {
      console.log(`📋 Client "${companyName}" already exists in clients.json`);
      return;
    }
    
    // Add new client
    const newClient = {
      company_name: companyName,
      company_id: companyId,
      address: companyInfo.address,
      from_label: companyInfo.from_label,
      from_email_address: companyInfo.from_email_address,
      url: companyInfo.url,
      connected: false,
      date_added: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      })
    };
    
    clients.push(newClient);
    
    // Save back to file
    await fs.writeFile(clientsFilePath, JSON.stringify(clients, null, 2), 'utf8');
    
    console.log(`💾 SAVED NEW CLIENT TO clients.json:`);
    console.log(`   📋 Name: ${companyName}`);
    console.log(`   🆔 ID: ${companyId}`);
    console.log(`   📍 Address: ${companyInfo.address}`);
    console.log(`   🏷️ From Label: ${companyInfo.from_label}`);
    console.log(`   📧 From Email: ${companyInfo.from_email_address}`);
    console.log(`   🌐 URL: ${companyInfo.url}`);
    console.log(`   📅 Added: ${newClient.date_added}`);
    
  } catch (error) {
    console.error('❌ Error saving client info:', error.message);
  }
}

export async function getProfile() {
  try {
    console.log('🔍 Fetching profile from Klaviyo authorization endpoint...');
    
    const response = await axios.post(`${SERVER_BASE}/request`, {
      method: 'GET',
      url: `https://www.klaviyo.com/ajax/authorization`
    });
    
    if (!response.data?.success) {
      throw new Error('Authorization request failed - not authenticated');
    }
    
    const data = response.data.data;
    
    // Extract the requested fields
    const profileInfo = {
      company_id: data.company,
      company_name: data.company_name,
    };
    
    // Log the extracted information
    console.log('✅ Profile information extracted:');
    console.log(`   Company Name: ${profileInfo.company_name}`);
    console.log(`   Company ID: ${profileInfo.company_id}`);
    
    return profileInfo;
    
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

export async function getCompanyInfo() {
  try {
    console.log('🔍 Fetching company info from Klaviyo company-info endpoint...');
    
    const response = await axios.post(`${SERVER_BASE}/request`, {
      method: 'GET',
      url: `https://www.klaviyo.com/setup/api/v1/company-info`
    });
    
    if (!response.data?.success) {
      throw new Error('Company info request failed - not authenticated');
    }
    
    const data = response.data.data;
    
    // Parse address into a single string
    const addressParts = [
      data.address?.street_address,
      data.address?.street_address2,
      data.address?.city,
      data.address?.region,
      data.address?.zip_code,
      data.address?.country
    ].filter(Boolean); // Remove null/undefined values
    
    const parsedAddress = addressParts.join(', ');
    
    // Extract the requested fields
    const companyInfo = {
      address: parsedAddress,
      from_label: data.from_label,
      from_email_address: data.from_email_address,
      url: data.url
    };
    
    // Log the extracted information
    console.log('✅ Company information extracted:');
    console.log(`   From Label: ${companyInfo.from_label}`);
    console.log(`   From Email: ${companyInfo.from_email_address}`);
    console.log(`   URL: ${companyInfo.url}`);
    console.log(`   Address: ${companyInfo.address}`);
    
    return companyInfo;
    
  } catch (error) {
    console.error('❌ Error fetching company info:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// Create and start the email monitor
const emailMonitor = new EmailMonitor();

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received shutdown signal");
  emailMonitor.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received termination signal");
  emailMonitor.stop();
  process.exit(0);
});

// Start the monitor
emailMonitor.start();

export default EmailMonitor; 