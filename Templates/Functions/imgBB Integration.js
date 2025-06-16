// Helper function to create request options for ImgBB API
async function createImgbbRequestOptions(
    method = 'GET',
    body = null,
    secFetchSite = 'same-origin',
    referrerUrl = 'https://flowmailai.imgbb.com/'
  ) {
    const headers = {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9,bg;q=0.8",
      "cache-control": "max-age=0",
      "priority": "u=0, i",
      "sec-ch-ua": '"Microsoft Edge";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": secFetchSite,
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1"
    };
  
    const options = {
      headers,
      method,
      mode: "cors",
      credentials: "include",
      referrer: referrerUrl,
      referrerPolicy: "strict-origin-when-cross-origin",
    };
  
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    } else {
      options.body = null;
    }
  
    return options;
  }
  
  // Helper function to fetch data from ImgBB
  async function fetchFromImgbb(
    baseUrl,
    endpoint,
    method = 'GET',
    body = null,
    secFetchSite = 'same-origin',
    referrerUrl = 'https://flowmailai.imgbb.com/'
  ) {
    const options = await createImgbbRequestOptions(method, body, secFetchSite, referrerUrl);
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    if (!response.ok) {
      const errorText = await response.text();
      if (saveHTML) {
          const { fileURLToPath } = await import('url');
          const path = (await import('path')).default;
          const fs = (await import('fs')).default;
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          const errorFileName = `${baseUrl.replace(/[^a-zA-Z0-9]/g, '_')}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}_error.html`;
          const errorFilePath = path.join(__dirname, errorFileName);
          fs.writeFileSync(errorFilePath, errorText, 'utf8');
          console.error(`HTTP error ${response.status}: ${response.statusText}. Error response saved to ${errorFilePath}`);
      } else {
          console.error(`HTTP error ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 200)}...`);
      }
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }
  
  // Function to parse album names and ids from HTML content
  function parseAlbumData(htmlContent) {
    const albums = [];
    const regex = /<div class="list-item[^"]*?"[^>]*?data-type="album"[^>]*?data-id="([^"]+)"[^>]*?data-name="([^"]+)"/g;
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      albums.push({ id: match[1], name: match[2] });
    }
    return albums;
  }
  
  // Main function to get albums and log their names
  export async function getAlbums() {
    try {
      const baseUrl = "https://flowmailai.imgbb.com";
      const albumsEndpoint = "/albums";
      console.log(`Fetching albums from ${baseUrl}${albumsEndpoint}...`);
      const htmlContent = await withRetry(() => fetchFromImgbb(baseUrl, albumsEndpoint, 'GET', null, 'same-origin', 'https://flowmailai.imgbb.com/'));
  
      if (saveHTML) {
        const { fileURLToPath } = await import('url');
        const path = (await import('path')).default;
        const fs = (await import('fs')).default;
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const filePath = path.join(__dirname, 'imgbb_albums_response.html');
        fs.writeFileSync(filePath, htmlContent, 'utf8');
        console.log('Albums HTML response saved to', filePath);
      }
  
      console.log("Parsing album names...");
      const albums = parseAlbumData(htmlContent);
  
      if (albums.length > 0) {
        console.log("Found Albums:");
        albums.forEach(album =>
          console.log(`- ${album.name} (ID: ${album.id}) | Album Page URL: https://ibb.co/album/${album.id}`)
        );
      } else {
        console.log("No albums found in the HTML content.");
      }
      return albums;
  
    } catch (error) {
      console.error("Error in getAlbums:", error);
      return [];
    }
  }
  
  // Function to parse image details (names and direct links) from an album page HTML
  function parseImageDetails(htmlContent) {
    const imagesWithDescriptions = parseImagesWithDescriptions(htmlContent);
    const allImagesBasic = parseImagesBasic(htmlContent);
    const processedUrls = new Set();
    const combinedImages = [];
  
    for (const img of imagesWithDescriptions) {
      combinedImages.push(img);
      processedUrls.add(img.directLink);
    }
  
    for (const img of allImagesBasic) {
      if (!processedUrls.has(img.directLink)) {
        combinedImages.push(img);
        // processedUrls.add(img.directLink); // Not strictly necessary here if parseImagesWithDescriptions is comprehensive
      }
    }
    return combinedImages;
  }
  
  function parseImagesWithDescriptions(htmlContent) {
    const images = [];
    const divRegex = /<div class="list-item[^"]*"[^>]*data-id="([^"]+)"[^>]*data-description="([^"]*)"[^>]*data-title="([^"]+)"[^>]*data-object='([^']+)'[^>]*>([\s\S]*?)<\/div>/gi;
    let divMatch;
    while ((divMatch = divRegex.exec(htmlContent)) !== null) {
      const id = divMatch[1];
      const description = divMatch[2].replace(/"/g, '"');
      const title = divMatch[3];
      const divContent = divMatch[5];
  
      const imgRegex = /<a href="([^"]+)"[^>]*class="image-container --media"[^>]*>\s*<img src="([^"]+)" alt="([^"]*)" width="(\d+)" height="(\d+)"[^>]*>/i;
      const imgMatch = imgRegex.exec(divContent);
  
      if (imgMatch) {
        const directImageUrl = imgMatch[2];
        const imageName = imgMatch[3] || title; // Fallback to title if alt is empty
        const imageWidth = imgMatch[4];
        const imageHeight = imgMatch[5];
  
        images.push({
          id: id,
          name: imageName,
          directLink: directImageUrl,
          width: imageWidth,
          height: imageHeight,
          description: description
        });
      }
    }
    return images;
  }
  
  function parseImagesBasic(htmlContent) {
    const images = [];
    const regex = /<a href="([^"]+)"[^>]*class="image-container --media"[^>]*>\s*<img src="([^"]+i\.ibb\.co[^"]+)" alt="([^"]*)" width="(\d+)" height="(\d+)"/gi;
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      const directImageUrl = match[2];
      const imageName = match[3]; // alt can be empty
      const imageWidth = match[4];
      const imageHeight = match[5];
      images.push({
        name: imageName,
        directLink: directImageUrl,
        width: imageWidth,
        height: imageHeight
      });
    }
    return images;
  }
  
  // Retry helper for rate limiting
  async function withRetry(fn, maxRetries = 500, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (err.message && err.message.includes('HTTP error 429')) {
          console.warn(`Rate limited (429). Retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw err;
        }
      }
    }
    throw new Error('Max retries reached');
  }
  
  // Function to get and parse images from a single album (with pagination)
  export async function getAlbumImages(albumId, albumName) {
    if (!albumId) {
      console.error("Album ID is required to fetch images.");
      return [];
    }
  
    let allImages = [];
    let currentEndpoint = `/album/${albumId}`; // Initial endpoint
    const baseUrl = "https://ibb.co";
    let pageNum = 1;
    const visitedEndpoints = new Set(); // To prevent infinite loops
    const MAX_PAGES = 50; // Safety limit for pagination
  
    try {
      while (currentEndpoint && !visitedEndpoints.has(currentEndpoint) && pageNum <= MAX_PAGES) {
        console.log(`Fetching images for album '${albumName}' (ID: ${albumId}), page ${pageNum} from ${baseUrl}${currentEndpoint}...`);
        visitedEndpoints.add(currentEndpoint);
  
        const htmlContent = await withRetry(() => fetchFromImgbb(
          baseUrl,
          currentEndpoint,
          'GET',
          null,
          'cross-site',
          'https://flowmailai.imgbb.com/' // Referrer for the initial page, might adjust for subsequent if needed
        ));
  
        if (saveHTML) {
          const { fileURLToPath } = await import('url');
          const path = (await import('path')).default;
          const fs = (await import('fs')).default;
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          const filePath = path.join(__dirname, `imgbb_album_${albumId}_page_${pageNum}_response.html`);
          fs.writeFileSync(filePath, htmlContent, 'utf8');
          console.log(`HTML response for album ${albumId}, page ${pageNum} saved to`, filePath);
        }
  
        const imagesOnPage = parseImageDetails(htmlContent);
        if (imagesOnPage.length > 0) {
          allImages = allImages.concat(imagesOnPage);
        } else if (pageNum > 1) {
          // If not the first page and no images found, likely end of pagination
          console.log(`No new images found on page ${pageNum}. Assuming end of album content.`);
          break;
        }
  
  
        // Find next page link. Example: <a data-pagination="next" href="https://ibb.co/album/nMcy6V?page=2&seek=kgLmBxsF">
        const nextPageRegex = /<a\s[^>]*data-pagination="next"[^>]*href="([^"]+)"/i;
        const nextPageMatch = nextPageRegex.exec(htmlContent);
  
        if (nextPageMatch && nextPageMatch[1]) {
          let nextUrl = nextPageMatch[1].replace(/&/g, '&'); // Decode HTML entities
          if (nextUrl.startsWith(baseUrl)) {
            currentEndpoint = nextUrl.substring(baseUrl.length); // Make it a relative endpoint
          } else if (nextUrl.startsWith('/')) {
            currentEndpoint = nextUrl; // Already a relative endpoint
          } else {
            // This case might occur if the href is relative to the current path, not root.
            // For simplicity, we'll assume hrefs are absolute or root-relative.
            console.warn(`Next page URL "${nextUrl}" is not absolute or root-relative. Stopping pagination.`);
            currentEndpoint = null;
          }
        } else {
          currentEndpoint = null; // No next page link found
        }
        pageNum++;
      }
  
      if (pageNum > MAX_PAGES) {
          console.warn(`Reached maximum page limit (${MAX_PAGES}) for album ${albumName}.`)
      }
  
      if (allImages.length > 0) {
        console.log(`Found a total of ${allImages.length} Images in Album '${albumName}'.`);
      } else {
        console.log(`No images found in album ${albumId} after checking pages, or parsing failed. Check saved HTML (if any).`);
      }
      return allImages;
  
    } catch (error) {
      console.error(`Error in getAlbumImages for album ID ${albumId}:`, error);
      return [];
    }
  }
  
  
  export async function getRandomImageFromAlbum(albumId, albumName, count = 1) {
    try {
      const images = await withRetry(() => getAlbumImages(albumId, albumName));
      if (!images || images.length === 0) {
        console.log(`No images found in album ${albumName} to select from.`);
        return null; // Return null or an empty array as appropriate
      }
  
      const actualCount = Math.min(count, images.length);
      if (count > images.length) {
        console.warn(`Requested ${count} images but only ${images.length} are available. Returning all available images in random order.`);
      }
  
      const imagesCopy = [...images];
      for (let i = imagesCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [imagesCopy[i], imagesCopy[j]] = [imagesCopy[j], imagesCopy[i]];
      }
  
      const selectedImages = imagesCopy.slice(0, actualCount);
      console.log(`\nRandomly selected ${selectedImages.length} image${selectedImages.length !== 1 ? 's' : ''} from ${albumName}:`);
      selectedImages.forEach((img, index) => {
        console.log(`\nImage ${index + 1}:`);
        console.log(`- Name: ${img.name}`);
        console.log(`- URL: ${img.directLink}`);
        console.log(`- Dimensions: ${img.width}x${img.height}`);
  
  
        if (img.description && img.description.trim() !== "") {
          // Replace HTML entities with actual characters before displaying
          const cleanDescription = img.description.replace(/&quot;/g, '"');
          //console.log(`- Raw Description: ${cleanDescription}`);
          try {
            // Attempt to parse if it looks like a JSON object/array (starts with { or [ and ends with } or ])
            // Or if it's a comma-separated key-value like structure that needs wrapping
            let parsableDescription = cleanDescription.trim();
            if ((parsableDescription.startsWith('{') && parsableDescription.endsWith('}')) ||
                (parsableDescription.startsWith('[') && parsableDescription.endsWith(']'))) {
              // Already looks like JSON
            } else if (parsableDescription.includes(':') && parsableDescription.includes(',')) {
              // Attempt to make it JSON-like if it's key: "value", key2: "value"
              // This is heuristic and might need refinement based on actual description format
              if (!parsableDescription.startsWith('{')) parsableDescription = '{' + parsableDescription;
              if (!parsableDescription.endsWith('}')) parsableDescription = parsableDescription + '}';
            }
  
            const descObj = JSON.parse(parsableDescription);
            console.log(`- Parsed Description:`);
            for (const [key, value] of Object.entries(descObj)) {
              console.log(`  - ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
            }
          } catch (e) {
            // If parsing fails, just show the raw description that was already logged
            // console.log(`- Description (could not parse as JSON): ${img.description}`);
          }
        }
      });
      return selectedImages;
    } catch (error) {
      console.error(`Error in getRandomImageFromAlbum for album ${albumName}:`, error);
      return null;
    }
  }
  
  export async function getAlbumImagesData(albumId, albumName) {
    try {
      // Use the existing function to get all images
      const images = await withRetry(() => getAlbumImages(albumId, albumName));
      
      if (!images || images.length === 0) {
        console.log(`No images found in album ${albumName} to process.`);
        return [];
      }

      // Map the images array to a new array with only the required fields
      const simplifiedImages = images.map(img => {
        // Clean up the description if it exists
        let cleanDescription = null;
        if (img.description && img.description.trim() !== "") {
          cleanDescription = img.description.replace(/&quot;/g, '"');
        }
        
        return {
          name: img.name || "",
          directLink: img.directLink || "",
          description: cleanDescription
        };
      });

      console.log(`Processed ${simplifiedImages.length} images from album '${albumName}'`);
      return simplifiedImages;
    } catch (error) {
      console.error(`Error in getAlbumImagesData for album ${albumName}:`, error);
      return [];
    }
  }
  
  // Run the main functions
  async function main() {
    const albumIdForSquareImages = "f6b9c7d2";
    const albumNameForSquareImages = "Square Images";
    const imagesData = await getAlbumImagesData(albumIdForSquareImages, albumNameForSquareImages);
    console.log(JSON.stringify(imagesData, null, 2));
  }
  
  // Set saveHTML to true if you want to inspect the fetched HTML pages
  const saveHTML = false; // Set to true to save the HTML response to a file for inspection
  
  // Call main function
  //main();