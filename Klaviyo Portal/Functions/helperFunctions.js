import { DateTime } from 'luxon';
import axios from 'axios';

const SERVER_URL = 'http://138.68.69.38:3001';
const KLAVIYO_URL = 'https://www.klaviyo.com';

// Get company timezone only (without profile logging)
export async function getTimezone() {
  try {
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/authorization`
    });
    
    if (response.data?.success && response.data?.data?.company_timezone) {
      return response.data.data.company_timezone;
    } else {
      console.warn('⚠️ Could not get timezone, using UTC');
      return 'UTC';
    }
    
  } catch (error) {
    console.error('❌ Error fetching timezone:', error.message);
    return 'UTC'; // fallback to UTC
  }
}

// Helper function to convert DD/MM/YYYY to Unix timestamp with proper timezone handling
export function convertDateToTimestamp(dateStr, timezone = 'UTC') {
  try {
      const [day, month, year] = dateStr.split('/');
      
      // Use Luxon to create date in the specified timezone
      const dt = DateTime.fromObject(
          { year: parseInt(year), month: parseInt(month), day: parseInt(day) },
          { zone: timezone }
      );
      
      if (!dt.isValid) {
          throw new Error(`Invalid date: ${dt.invalidReason}`);
      }
      
      const timestamp = Math.floor(dt.toSeconds());
      //console.log(`📅 Date ${dateStr} converted to timestamp: ${timestamp} (timezone: ${timezone})`);
      
      return timestamp;
      
  } catch (error) {
      console.error('❌ Invalid date format. Use DD/MM/YYYY:', error.message);
      return null;
  }
}
