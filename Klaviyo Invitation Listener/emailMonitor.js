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
import supabase from "./supabaseClient.js";
import { authorize, createApiKey, changeClient } from "../Klaviyo Portal/Functions/smallFunctions.js";

// Klaviyo email constants
const KLAVIYO_SENDER_EMAIL = "no-reply@klaviyo.com";
const KLAVIYO_INVITATION_SUBJECT = "New Klaviyo Account Invitation";

// Server configuration
const SERVER_BASE = 'http://138.68.69.38:3001';

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
      await authorize();
      
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
      const [profile, companyInfo, apiKey] = await Promise.all([
        getProfile(),
        getCompanyInfo(),
        createApiKey('Flow Fast AI')
      ]);

      await changeClient('BBB Marketing');

      if (profile.company_name === brandName) {
        console.log("✅ INVITATION ACCEPTED SUCCESSFULLY!");
        console.log(`   🏢 Brand: ${brandName || 'Unknown'}`);
        
        // Save client information to Supabase
        await saveClientInfo(profile.company_name, profile.company_id, companyInfo, apiKey);
        console.log("✅ CLIENT INFORMATION SAVED TO SUPABASE");
        //console.log("✅ API KEY CREATED:", apiKey);
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

async function saveClientInfo(companyName, companyId, companyInfo, apiKey) {
  try {
    console.log('💾 Saving new client to Supabase...');
    
    // Check if client already exists
    const { data: existingClient, error: checkError } = await supabase
      .from('klaviyo_accounts')
      .select('*')
      .eq('company_id', companyId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('❌ Error checking for existing client:', checkError);
      console.error('❌ Check error details:', JSON.stringify(checkError, null, 2));
      return;
    }
    
    if (existingClient) {
      console.log(`📋 Client "${companyName}" already exists in Supabase - updating existing record`);
      //console.log('🔍 Debug - Existing client:', existingClient);
      
      // Update existing client in klaviyo_accounts
      const updateData = {
        company_name: companyName,
        address: companyInfo.address || '',
        from_label: companyInfo.from_label || '',
        from_email_address: companyInfo.from_email_address || '',
        url: companyInfo.url || '',
        connected: true,
        notes: 'Re-invited and reconnected to Klaviyo.'
      };
      
      // Only update api_key if we have a new one (not null)
      if (apiKey) {
        updateData.api_key = apiKey;
      }
      
      const { data: updatedClient, error: updateError } = await supabase
        .from('klaviyo_accounts')
        .update(updateData)
        .eq('company_id', companyId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating existing client in Supabase (klaviyo_accounts):', updateError);
        console.error('❌ Update error details:', JSON.stringify(updateError, null, 2));
      } else if (updatedClient) {
        console.log(`💾 UPDATED ${companyName.toUpperCase()} IN klaviyo_accounts`);
      } else {
        console.error('❌ No data returned from update operation into klaviyo_accounts');
      }

      // Also update the profiles table to mark as reconnected
      //console.log('🔄 Updating profiles table to mark as reconnected...');
      try {
        // First, get the current profile data for this company
        const { data: currentProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('klaviyo_status, klaviyo_brand_data')
          .eq('klaviyo_brand_data->>company_id', companyId)
          .single();

        if (fetchError) {
          console.error(`❌ Error fetching profile for company_id ${companyId}:`, fetchError);
        } else {
          // Update the klaviyo_status object
          const updatedKlaviyoStatus = {
            ...currentProfile.klaviyo_status,
            connected: true,
            removedFromKlaviyo: false,
            removedDate: ''
          };

          // Update the profile with the modified klaviyo_status
          const { data, error } = await supabase
            .from('profiles')
            .update({ 
              klaviyo_status: updatedKlaviyoStatus,
              updated_at: new Date().toISOString()
            })
            .eq('klaviyo_brand_data->>company_id', companyId);

          if (error) {
            console.error(`❌ Error updating profiles for company_id ${companyId}:`, error);
          } else {
            console.log(`✅ Updated profiles table for company_id ${companyId} - marked as reconnected`);
          }
        }
      } catch (err) {
        console.error(`❌ Exception updating profiles for company_id ${companyId}:`, err.message);
      }
    } else {
      // Prepare insert data for klaviyo_accounts
      const insertData = {
        company_name: companyName,
        company_id: companyId,
        address: companyInfo.address || '',
        from_label: companyInfo.from_label || '',
        from_email_address: companyInfo.from_email_address || '',
        url: companyInfo.url || '',
        connected: true,
        notes: 'Invitation accepted. App still needs to be connected to Klaviyo.'
      };
      
      // Only include api_key if we have one (not null)
      if (apiKey) {
        insertData.api_key = apiKey;
      }
      
      //console.log('🔍 Debug - Insert data for klaviyo_accounts:', insertData);
      
      // Insert new client into klaviyo_accounts
      const { data: newClient, error: insertError } = await supabase
        .from('klaviyo_accounts')
        .insert(insertData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error inserting client to Supabase (klaviyo_accounts):', insertError);
        console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
        // Continue to try to save to profiles table
      } else if (newClient) {
        console.log(`💾 SAVED ${companyName.toUpperCase()} TO klaviyo_accounts`);
      } else {
        console.error('❌ No data returned from insert operation into klaviyo_accounts');
      }
    }
    
  } catch (error) {
    console.error('❌ Error saving client info:', error.message);
    console.error('❌ Full error:', error);
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