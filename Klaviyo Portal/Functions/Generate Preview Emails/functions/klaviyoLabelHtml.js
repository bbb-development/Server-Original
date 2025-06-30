export function klaviyoLabelHtml(htmlContent = null) {
    if (!htmlContent) {
        return '';
    }
    
    // Find class="klBranding"
    const klBrandingIndex = htmlContent.indexOf('class="klBranding"');
    if (klBrandingIndex === -1) {
        return '';
    }
    
    // Search backwards from klBranding to find the nearest <div style="margin:0px auto;max-width:600px;">
    const targetDivPattern = '<div style="margin:0px auto;max-width:600px;">';
    let searchIndex = klBrandingIndex;
    
    while (searchIndex >= 0) {
        const divIndex = htmlContent.lastIndexOf(targetDivPattern, searchIndex);
        if (divIndex === -1) {
            break;
        }
        
        // Check if this div contains our klBranding
        const divContent = htmlContent.substring(divIndex);
        if (divContent.includes('class="klBranding"')) {
            // Found the right div, now find its closing tag
            let openDivs = 1;
            let currentIndex = divIndex + targetDivPattern.length;
            
            while (currentIndex < htmlContent.length && openDivs > 0) {
                if (htmlContent.substring(currentIndex, currentIndex + 5) === '<div') {
                    openDivs++;
                } else if (htmlContent.substring(currentIndex, currentIndex + 6) === '</div>') {
                    openDivs--;
                }
                currentIndex++;
            }
            
            // Extract the complete div
            const endIndex = currentIndex + 5; // Include the closing </div>
            return htmlContent.substring(divIndex, endIndex);
        }
        
        searchIndex = divIndex - 1;
    }
    
    return '';
}
