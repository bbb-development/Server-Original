import fs from 'fs';

export function findMostCommonColor(buttons, property) {
  const colorCounts = buttons.reduce((acc, button) => {
    const color = button[property];
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
}

export function rgbToHex(rgb) {
  // Handle rgb(r, g, b) format
  const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  // If it's already hex or another format, return as is
  return rgb;
}

export function cleanJsonResponse(response) {
  return response.replace(/```json\n|\n```/g, '').trim();
}

export function parseJsonResponse(response) {
  try {
    const cleanedResponse = cleanJsonResponse(response);
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    return null;
  }
}

export function cleanupFiles(filePaths) {
  if (!Array.isArray(filePaths)) {
    filePaths = [filePaths];
  }
  
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up file: ${filePath}`);
      } catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error);
      }
    }
  });
} 