import sharp from 'sharp';
import { IMAGE_API_KEY } from './config.js';
import { askGemini, buttonColorsSchema } from './askGemini.js';
import fs from 'fs/promises';

export async function extractImages(url) {
  console.log('Starting brand brief extraction for URL:', url);
  
  const maxRetries = 2;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Start the extraction
      const res = await fetch('https://api.extract.pics/v0/extractions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${IMAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();
      
      if (!res.ok) {
        console.error('Failed to start extraction:', json.message);
        throw new Error(json.message || 'Failed to start extraction');
      }

      const id = json.data.id;
      let status = 'pending';
      let checkCount = 0;

      // Check status until done or error
      while (status !== 'done' && status !== 'error') {
        checkCount++;
        
        const statusRes = await fetch(`https://api.extract.pics/v0/extractions/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${IMAGE_API_KEY}`,
          },
        });

        const statusJson = await statusRes.json();
        status = statusJson.data.status;

        if (status === 'error') {
          console.error('Extraction failed');
          throw new Error('Extraction failed');
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Get final result
      const finalRes = await fetch(`https://api.extract.pics/v0/extractions/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${IMAGE_API_KEY}`,
        },
      });

      const finalJson = await finalRes.json();
      console.log(`Found ${finalJson.data.images.length} brand images`);
      
      return finalJson.data.images;
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        console.error(`Failed after ${maxRetries} attempts:`, error.message);
        throw error;
      }
      console.log(`Attempt ${retryCount} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
    }
  }
}

export async function analyzeButtonColorsFromScreenshot(page) {
  console.log('No buttons found, taking screenshot for analysis...');
  
  const maxRetries = 1;
  let retryCount = 0;
  let croppedImagePaths = []; // To store paths of the 3 cropped images
  let originalScreenshotPath; // To store path of the original full screenshot
  
  while (retryCount < maxRetries) {
    try {
      // 1. Ensure page is loaded
      //console.log('- waiting for DOM content to load...');
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      //console.log('- DOM content loaded');
      //console.log('- waiting for fonts to load...');
      await page.waitForTimeout(2000);
      //console.log('- fonts loaded');
      
      // 2. Take a single full-page screenshot
      //console.log('- taking full page screenshot');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      originalScreenshotPath = `screenshot-full-${timestamp}.png`;
      
      await page.screenshot({ 
        path: originalScreenshotPath,
        fullPage: true,
        timeout: 20000 // Increased timeout slightly for full page
      });
      console.log('Full screenshot saved');

      // 3. Use sharp to process the screenshot
      //console.log('- processing screenshot with sharp...');
      const metadata = await sharp(originalScreenshotPath).metadata();
      const fullHeight = metadata.height;
      const fullWidth = metadata.width;

      if (!fullHeight || !fullWidth || fullHeight <= 0 || fullWidth <= 0) {
        throw new Error(`Invalid dimensions from sharp metadata: width=${fullWidth}, height=${fullHeight}`);
      }

      const partHeight = Math.floor(fullHeight / 3);
      if (partHeight <= 0) {
        throw new Error(`Calculated part height is invalid: ${partHeight}`);
      }

      croppedImagePaths = []; // Reset paths for retry
      // 4. Crop into 3 parts
      for (let i = 0; i < 3; i++) {
        const cropPath = `screenshot-part${i + 1}-${timestamp}.png`;
        const top = i * partHeight;
        const height = (i === 2) ? (fullHeight - top) : partHeight; // Use remaining height for last part

        if (top < 0 || height <= 0 || top + height > fullHeight) {
            console.warn(`Skipping crop for part ${i + 1} due to invalid dimensions: top=${top}, height=${height}, fullHeight=${fullHeight}`);
            continue; // Skip invalid crop
        }

        //console.log(`- cropping part ${i + 1} (top: ${top}, height: ${height})`);
        await sharp(originalScreenshotPath)
          .extract({ left: 0, top: top, width: fullWidth, height: height })
          .toFile(cropPath);
          
        //console.log(`Cropped part ${i + 1} saved as: ${cropPath}`);
        croppedImagePaths.push(cropPath);
      }
      
      // 5. Check if we got enough cropped parts (ideally 3)
      if (croppedImagePaths.length === 0) {
        throw new Error('Failed to create any valid cropped image parts.');
      }
      if (croppedImagePaths.length < 3) {
        console.warn(`Only ${croppedImagePaths.length} parts were cropped successfully.`);
      }
      
      // 6. Delete the original full screenshot now that crops are made
      try {
        await fs.unlink(originalScreenshotPath);
        //console.log(`Deleted original full screenshot: ${originalScreenshotPath}`);
        originalScreenshotPath = null; // Clear path after deletion
      } catch (cleanupError) {
        console.error(`Error deleting original screenshot ${originalScreenshotPath}:`, cleanupError);
        // Continue anyway, as we have the crops
      }

      // 7. Analyze colors using Gemini
      console.log('- analyzing colors with Gemini...');
      const response = await askGemini(
        "Based on these screenshots of the website, analyze the button colors. Look for the most prominent button colors in the UI. Return the background color and text color in hex format.",
        croppedImagePaths,
        buttonColorsSchema
      );

      // Parse the response - Gemini returns clean JSON when using schema
      const colors = JSON.parse(response);
      console.log('Button colors analyzed:', colors);

      // 8. Clean up cropped images
      for (const path of croppedImagePaths) {
        try {
          await fs.unlink(path);
          //console.log(`Cleaned up crop: ${path}`);
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
      
      return colors;

    } catch (error) {
      retryCount++;
      console.error(`Screenshot/Cropping attempt ${retryCount} failed:`, error.message);
      
      // Cleanup any partially created files on failure before retry/exit
      if (originalScreenshotPath) {
        try { 
          await fs.unlink(originalScreenshotPath); 
          console.log(`Cleaned up original screenshot: ${originalScreenshotPath}`); 
        } catch (e) { 
          console.error('Cleanup error', e);
        }
        originalScreenshotPath = null;
      }
      
      for (const p of croppedImagePaths) { 
        if (await fs.access(p).then(() => true).catch(() => false)) { 
          try { 
            await fs.unlink(p); 
            console.log(`Cleaned up crop: ${p}`); 
          } catch (e) { 
            console.error('Cleanup error', e);
          }
        }
      }
      croppedImagePaths = [];
      
      if (retryCount >= maxRetries) {
        console.error('Max retries reached for screenshot/cropping. Using default colors.');
        return {
          buttonBackgroundColor: '#333333',
          buttonTextColor: '#444444'
        };
      }
      
      console.log(`Waiting 3 seconds before retry ${retryCount}...`);
      await page.waitForTimeout(3000);
    }
  }
} 