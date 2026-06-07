export const getDynamicPrice = (product: any, commissions: Record<string, number>) => {
  if (product.basePrice === undefined) return product.price; // fallback if no base price
  
  let rate = commissions[product.segment || ''] || 0;
  if (product.category) {
     const catId = product.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
     if (commissions[`cat_${catId}`] !== undefined) rate = commissions[`cat_${catId}`];
     if (product.subcategory && commissions[`subcat_${catId}_${product.subcategory}`] !== undefined) {
        rate = commissions[`subcat_${catId}_${product.subcategory}`];
     }
  }
  return parseFloat((product.basePrice * (1 + (rate / 100))).toFixed(2));
};

export const getDynamicBasePricePerPerson = (product: any, commissions: Record<string, number>) => {
  if (product.basePricePerPersonAtMin === undefined) return product.pricePerPersonAtMin; 
  
  let rate = commissions[product.segment || ''] || 0;
  if (product.category) {
     const catId = product.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
     if (commissions[`cat_${catId}`] !== undefined) rate = commissions[`cat_${catId}`];
     if (product.subcategory && commissions[`subcat_${catId}_${product.subcategory}`] !== undefined) {
        rate = commissions[`subcat_${catId}_${product.subcategory}`];
     }
  }
  return parseFloat((product.basePricePerPersonAtMin * (1 + (rate / 100))).toFixed(2));
};

export const transformProductPricing = (product: any, commissions: Record<string, number>) => {
  if (!product) return product;
  const newPrice = getDynamicPrice(product, commissions);
  const newPledgePrice = getDynamicBasePricePerPerson(product, commissions);
  
  return {
     ...product,
     price: newPrice !== undefined ? newPrice : product.price,
     pricePerPersonAtMin: newPledgePrice !== undefined ? newPledgePrice : product.pricePerPersonAtMin,
     commissionRate: (() => {
       let rate = commissions[product.segment || ''] || 0;
       if (product.category) {
          const catId = product.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
          if (commissions[`cat_${catId}`] !== undefined) rate = commissions[`cat_${catId}`];
          if (product.subcategory && commissions[`subcat_${catId}_${product.subcategory}`] !== undefined) {
             rate = commissions[`subcat_${catId}_${product.subcategory}`];
          }
       }
       return rate;
     })()
  };
};
