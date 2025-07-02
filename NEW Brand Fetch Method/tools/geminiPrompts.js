function brandBriefPrompt(url) {
    return `Analyze the website content from ${url} and extract key brand information.
Return ONLY a JSON object with the following fields:
brandName: The name of the brand
brandDescription: A concise description of what the brand does and its unique value proposition
brandAudience: The primary target audience for the brand
brandTone: The tone of voice used in the content (e.g., professional, friendly, authoritative)
brandMessage: The core message or theme that comes across in the content
brandIndustry: The kind of products the brand sells mostly. e.g Cosmetics, Clothing, Jewelry, etc.
topEmailText: A short text line that would fit as a text line in the header of emails under/above the logo. This should be something that makes sense regardless of the current season/month. Example: "90-Day Satisfaction & Money Back Guarantee". Use American English.
aboutUs: An object containing three flowing paragraphs that tell the brand's story:
{
"paragraph1": "First paragraph starting with 'At [Brand Name], we...'",
"paragraph2": "Second paragraph mentioning the best-seller and how it matches the first paragraph",
"paragraph3": "Third paragraph flowing into the brand mission starting with 'That all ties into our mission to...'"
}
All paragraphs should be sharp, one-sentence paragraphs that flow well together. Use American English.
NOTE: The example above is just an example, don't follow it exactly, use the content to create a brand analysis!!.
    NOTE 2: Always crawl the webpage given to get the most up-to-date data!`;
}

function brandBenefitsPrompt(url, imagesData) {
    return `Analyze the website content from ${url} and extract the 3 clearest store benefits/guarantees.

We are an email agency creating a benefits banner for e-commerce clients. Look for benefits like:
- Money-back guarantees
- Free shipping policies  
- Fast delivery promises
- Quality assurances
- Customer support guarantees
- Return policies
- Security/safety features
- And other similar store benefits

Here's the website to analyze: ${url}

Now that you have the home page content, please take out the 3x clear benefits from this store that match 3 icons from the list below.

Available Icons:
${imagesData.map((img, index) => `${index + 1}. Name: ${img.name}, DirectLink: ${img.directLink}${img.description ? ', Description: ' + img.description : ''}`).join('\n')}

IMPORTANT:
Return ONLY a JSON object with the following field:
- brandBenefits: An array of exactly 3 objects, each with a 'title', 'description', and 'DirectLink'

Example format:
{
  "brandBenefits": [
    {
      "title": "Fast Delivery",
      "description": "Receive your order within 2-5 business days.",
      "DirectLink": "https://i.ibb.co/placeholder/delivery.png"
    },
    {
      "title": "Money-back Guarantee", 
      "description": "Shop with confidence – return your purchase within 30 days for a full refund.",
      "DirectLink": "https://i.ibb.co/placeholder/guarantee.png"
    },
    {
      "title": "High Quality",
      "description": "We offer only premium products, carefully selected for maximum quality.",
      "DirectLink": "https://i.ibb.co/placeholder/quality.png"
    }
  ]
}

NOTE: Always crawl the webpage to get the most up-to-date benefit information!`;
}

function fetchURLsPrompt(links) {
    return `
        Analyze these internal links from the website and identify the URLs that most likely contain:
        1. The best sellers or most popular products collection
        2. The contact us page (or closest equivalent)
        3. The FAQ or help/support page (or closest equivalent)

        If you cannot find a specific type of URL, return null for that field.

        Return ONLY a valid JSON object in exactly this format:
        {
            "bestSellersUrl": "FULL URL or null",
            "contactUrl": "FULL URL or null",
            "faqUrl": "FULL URL or null"
        }

        Look for keywords like:
        - Best sellers: "best", "popular", "top", "featured", "bestseller", "trending"
        - Contact: "contact", "about", "support", "help", "customer-service"
        - FAQ: "faq", "help", "support", "questions", "customer-support"

        Links to analyze:
        ${JSON.stringify(links, null, 2)}
        `;
}

function productListPrompt(bestSellerPageHtml) {
    return `
        Analyze the following content from the best sellers page and create a list of the top 9 best-selling products.
        For each product, include:
        1. Product name
        2. Price (if available)
        3. Product URL - IMPORTANT: Make it a full URL including the protocol, www and domain name.
        4. Product Image URL - IMPORTANT: Copy the EXACT image URL including all parameters (like ?v=, &width=, etc.)

        Sort the products from best-selling to least-selling based on any available indicators (position, sales numbers, etc.).

        Return ONLY a JSON object with the following structure:
        {
            "productsFound": true/false,
            "products": [array of products] // only include this if productsFound is true
        }

        If you find products, set productsFound to true and include up to 9 products in the products array.
        If no clear products are found, set productsFound to false and omit the products array.
        
        NOTE: Don't make up any products. In order for the productsFound to be true, you must find 9 products with different names and urls.
        if they have the same name or url, they are most likely not real products.

        Content to analyze:
        ${bestSellerPageHtml}
    `;
}

function createDeliverabilitySnippetPrompt(url) {
  return `You are a deliverability snippet generator for transactional-style email content. 
  Your job is to generate clean, non-promotional hidden HTML blocks that boost email deliverability and avoid spam filters. 
  Use a neutral, logistical tone focused on shipping, processing, and account handling — never marketing.
  The website to analyze is ${url}.

### RULES TO FOLLOW:

1. Use **no more than 3 products** in the included list.
2. Avoid **every word and symbol** in the MASTER DO-NOT-USE LIST.
3. **Adjust brand and product names** slightly if needed to stay compliant.
4. If you're missing specific data like name or address, insert clean, generic placeholders.
   - Examples: \`Alex Green\`, \`789 Neutral Road\`, \`Techville, XX 12345\`, \`USD\`
5. It's okay if some sentences are **not fully grammatical** as long as no banned terms are used.
6. All content must be wrapped in a single \`<span style="color: transparent; display: none; ...">\` HTML block.
7. Keep the tone strictly **non-promotional**. Do not use emotional, urgent, or exaggerated language.
8. Never refer to this task as "an example" or say you're generating a snippet — just return the HTML block itself.

### MASTER DO-NOT-USE LIST:
❌ Words (Sorted Alphabetically)
Act fast
All
Amazing
Apply now
Best price
Bargain
Buy now
Call now
Cash bonus
Clearance
Click here
Congratulations
Confidential
Costs
Cure
Don't hesitate
Don't miss
Earn money
Easy terms
Eliminate debt
Exclusive deal
Final notice
Financial freedom
For you
Free
Feel free
Fast cash
Get access
Get it now
Get paid
Great
Guarantee
Hidden
Hidden charges
Hurry
Income
Incredible
Increase sales
Instant
Join now
Life
Limited offer
Limited time
Lowest price
Lowest rate
Make money
Miracle
New
No catch
No hidden fees
Not junk
Offer expires
Online biz
Only
Opportunity
Opt in
Order
Passwords
Perfect
Please
Promotional
Request
Restricted
Risk-free
Save big
Satisfaction guaranteed
Soon
Special promotion
Supplies
This isn't spam
This won't last
Traffic
Unsubscribe
Urgent
Visit our website
While supplies last
Winner
Work from home
You're a winner
You've been selected

❌ Symbols
$

### TEMPLATE FORMAT:
<div><span style="color: transparent; display: none; height: 0; max-height: 0; font-size: 1px; max-width: 0; opacity: 0; mso-hide: all; width: 0;">

#{Order Number} – Thank you for choosing {Company Name}. Your items are being prepared and will be dispatched shortly. Keep this message for reference.

Included:

1x {Product Name 1} – {Price 1}  
1x {Product Name 2} – {Price 2}  
1x {Product Name 3} – {Price 3}  

Applied: {Code Used} – {Discount Amount}

Subtotal: {Subtotal Amount}  
Shipping: Standard Service  
Taxes: 0.00  
Total: {Total Amount} {Currency}

Shipping Information:

{Customer Name}  
{Street Address}  
{City, State/Province, ZIP}  
{Country}

Information:

{Customer Name}  
{Street Address}  
{City, State/Province, ZIP}  
{Country}

Shipping Method: Standard (5–7 business days)

Delivery Information:

Package expected 7–10 business days from send-out. Tracking will be sent. Processing happens Monday to Friday, not holidays.

Not arrived within timeframe? Support team available. We're ready to help.

1. **Processing**: Typical timing is 1–2 business days. At high volume, allow 3–5. This is before transit.

2. **Shipping & Arrival**: Standard delivery may apply to qualifying baskets. Expedited options may show at checkout. Timing depends on method and region.

3. **Payment & Security**: Transactions encrypted. Details protected. Payment methods shown at checkout.

4. **Returns & Resolution**: Contact us within 7 days if item is damaged or incorrect. Instructions will follow. Shipping-related amounts may not be refundable if no mistake occurred.

5. **Privacy Statement**: Info used to manage account and fulfill inquiry. We don't share data unless required.

6. **Rights & Content**: Materials belong to {Company Name} or licensed parties. Protected by intellectual property laws.

Thank you again from {Company Name}. We appreciate your support.

Regards,  
The {Company Name} Team

</span></div>

### WEBSITE CONTENT TO ANALYZE:
${url}

### INSTRUCTIONS:
Based on the website content above, generate a single deliverability snippet using all rules above. Extract the company name and product information from the content. Use generic placeholders for missing info such as customer name or address.

Now generate a single deliverability snippet using all rules above. Use generic placeholders for missing info such as customer name or address.`;
}

export { brandBriefPrompt, brandBenefitsPrompt, fetchURLsPrompt, productListPrompt, createDeliverabilitySnippetPrompt };