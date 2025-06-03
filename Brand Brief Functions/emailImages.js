import { getRandomImageFromAlbum } from '../Templates/Functions/imgBB Integration.js';
import { womanNames } from '../Templates/Functions/woman_names.js';

// Email template configuration with their respective album IDs and names
const emailTemplates = [
  // Welcome Flow
  { 
    name: "WF Email 1", 
    albumId: "RhSd3F", 
    albumName: "WF Email #1" 
  },
  { 
    name: "WF Email 2", 
    albumId: "tZnk3N", 
    albumName: "WF Email #2" 
  },
  { 
    name: "WF Email 3", 
    albumId: "gZMvTh", 
    albumName: "WF Email #3" 
  },
  
  // Browse Abandoned Flow
  { 
    name: "BA Email 1", 
    albumId: "LD26vF", 
    albumName: "BA Email #1" 
  },
  
  // Cart Abandoned Flow
  { 
    name: "AC Email 1", 
    albumId: "1MGtgP", 
    albumName: "AC Email #1" 
  },
  { 
    name: "AC Email 2", 
    albumId: "QDtxC6", 
    albumName: "AC Email #2" 
  },
  { 
    name: "AC Email 3", 
    albumId: "Wxzp4j", 
    albumName: "AC Email #3" 
  }
  // Removed AC Email 4 - handled separately as assistant
];

/**
 * Fetches assistant data (image and name) for AC Email 4
 * @returns {Promise<Object>} Object containing assistant image URL and random name
 */
export async function getAssistantData() {
  console.log('👩‍💼 Fetching assistant data for AC Email 4...');
  
  try {
    // Fetch random image for AC Email 4
    console.log('Fetching assistant image...');
    const images = await getRandomImageFromAlbum("nMcy6V", "AC Email #4", 1);
    
    // Get random woman name
    const randomName = womanNames[Math.floor(Math.random() * womanNames.length)];
    
    if (images && images.length > 0) {
      const image = images[0];
      const assistantData = {
        assistant_img: image.directLink || "",
        assistant_name: randomName
      };
      
      console.log(`✅ Successfully fetched assistant data: ${randomName} with image ${image.name}`);
      return assistantData;
    } else {
      console.warn('No assistant image found, using fallback');
      return {
        assistant_img: "",
        assistant_name: randomName
      };
    }
  } catch (error) {
    console.error('❌ Error fetching assistant data:', error);
    // Return fallback with random name but empty image
    const randomName = womanNames[Math.floor(Math.random() * womanNames.length)];
    return {
      assistant_img: "",
      assistant_name: randomName
    };
  }
}

/**
 * Fetches random images for all email templates (excluding AC Email 4)
 * @returns {Promise<Object>} Object containing email images and assistant data
 */
export async function getEmailImages() {
  console.log('🖼️  Fetching random images for all email templates...');
  
  try {
    // Make all image fetch calls in parallel for better performance
    const imagePromises = emailTemplates.map(async (template) => {
      try {
        console.log(`Fetching image for ${template.name}...`);
        const images = await getRandomImageFromAlbum(template.albumId, template.albumName, 1);
        
        if (images && images.length > 0) {
          const image = images[0];
          return {
            emailName: template.name,
            image: {
              name: image.name || "",
              directLink: image.directLink || "",
              width: image.width || null,
              height: image.height || null,
              description: image.description || null
            }
          };
        } else {
          console.warn(`No images found for ${template.name}`);
          return {
            emailName: template.name,
            image: {
              name: "No image available",
              directLink: "",
              width: null,
              height: null,
              description: null
            }
          };
        }
      } catch (error) {
        console.error(`Error fetching image for ${template.name}:`, error);
        return {
          emailName: template.name,
          image: {
            name: "Error fetching image",
            directLink: "",
            width: null,
            height: null,
            description: null
          }
        };
      }
    });

    // Also fetch assistant data in parallel
    const assistantPromise = getAssistantData();

    // Wait for all fetches to complete
    const [emailImageResults, assistantData] = await Promise.all([
      Promise.allSettled(imagePromises),
      assistantPromise
    ]);
    
    // Process email image results
    const emailImages = {};
    emailImageResults.forEach((result, index) => {
      const template = emailTemplates[index];
      if (result.status === 'fulfilled') {
        emailImages[template.name] = result.value.image;
        console.log(`✅ Successfully fetched image for ${template.name}: ${result.value.image.name}`);
      } else {
        emailImages[template.name] = {
          name: "Failed to fetch image",
          directLink: "",
          width: null,
          height: null,
          description: null
        };
        console.error(`❌ Failed to fetch image for ${template.name}:`, result.reason);
      }
    });

    const successCount = Object.values(emailImages).filter(img => img.directLink !== "").length;
    console.log(`🎉 Email images fetch completed: ${successCount}/${emailTemplates.length} successful`);
    console.log(`👩‍💼 Assistant data: ${assistantData.assistant_name}`);
    
    return {
      emailImages,
      assistant: assistantData
    };
    
  } catch (error) {
    console.error('❌ Error in getEmailImages:', error);
    // Return empty structure with error placeholders
    const errorImages = {};
    emailTemplates.forEach(template => {
      errorImages[template.name] = {
        name: "Error occurred",
        directLink: "",
        width: null,
        height: null,
        description: null
      };
    });
    
    // Fallback assistant data
    const randomName = womanNames[Math.floor(Math.random() * womanNames.length)];
    
    return {
      emailImages: errorImages,
      assistant: {
        assistant_img: "",
        assistant_name: randomName
      }
    };
  }
}

/**
 * Gets a random image for a specific email template (excluding AC Email 4)
 * @param {string} emailName - The name of the email template
 * @returns {Promise<Object|null>} Image object or null if not found
 */
export async function getEmailImageByName(emailName) {
  const template = emailTemplates.find(t => t.name === emailName);
  
  if (!template) {
    console.error(`Email template "${emailName}" not found`);
    return null;
  }
  
  try {
    console.log(`Fetching image for ${emailName}...`);
    const images = await getRandomImageFromAlbum(template.albumId, template.albumName, 1);
    
    if (images && images.length > 0) {
      const image = images[0];
      return {
        name: image.name || "",
        directLink: image.directLink || "",
        width: image.width || null,
        height: image.height || null,
        description: image.description || null
      };
    } else {
      console.warn(`No images found for ${emailName}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching image for ${emailName}:`, error);
    return null;
  }
}

/**
 * Gets the list of all available email template names (excluding AC Email 4)
 * @returns {string[]} Array of email template names
 */
export function getEmailTemplateNames() {
  return emailTemplates.map(template => template.name);
} 