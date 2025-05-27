// Shuffle function to randomize product order using Fisher-Yates algorithm
export function shuffleProducts(products, minCount = 9) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }
  
  // Check for any undefined/null products
  const validProducts = products.filter(product => product && product.productImgUrl && product.productName && product.productURL);
  
  if (validProducts.length === 0) {
    console.error('shuffleProducts: No valid products found!');
    return [];
  }
  
  // If we don't have enough products, duplicate them to reach minimum count
  let workingProducts = [...validProducts];
  while (workingProducts.length < minCount && validProducts.length > 0) {
    const duplicateIndex = workingProducts.length % validProducts.length;
    workingProducts.push({ ...validProducts[duplicateIndex] });
  }
  
  // Fisher-Yates shuffle algorithm
  for (let i = workingProducts.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    // Swap elements at i and randomIndex
    [workingProducts[i], workingProducts[randomIndex]] = [workingProducts[randomIndex], workingProducts[i]];
  }

  return workingProducts;
}