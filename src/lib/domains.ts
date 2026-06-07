export interface DomainCategory {
  id: string;
  label: string;
  subcategories: string[];
}

export interface DomainSegment {
  id: string;
  label: string;
  color: string;
  defaultTransactionType?: string;
  allowedTransactionTypes?: string[];
  categories?: DomainCategory[];
}

export interface Domain {
  id: string;
  name: string;
  label: string;
  primaryAction: string;
  segments: DomainSegment[];
}

export const TRANSACTION_TYPES = [
  { id: 'buy', label: 'Buy', buttonText: 'Buy Now' },
  { id: 'buy-used', label: 'Buy Used', buttonText: 'Buy Used' },
  { id: 'rent', label: 'Rent', buttonText: 'Rent' },
  { id: 'swap', label: 'Swap', buttonText: 'Swap' },
  { id: 'auction', label: 'Auction', buttonText: 'Bid Now' },
  { id: 'order', label: 'Order', buttonText: 'Order Now' },
  { id: 'book-table', label: 'Book Table', buttonText: 'Book Table' },
  { id: 'pre-order', label: 'Pre-order', buttonText: 'Pre-order' },
  { id: 'subscribe', label: 'Subscribe', buttonText: 'Subscribe' },
  { id: 'enroll', label: 'Enroll', buttonText: 'Enroll Now' },
  { id: 'book', label: 'Book', buttonText: 'Book' },
  { id: 'register', label: 'Register', buttonText: 'Register' },
  { id: 'watch', label: 'Watch Now', buttonText: 'Watch Now' },
  { id: 'rent-movie', label: 'Rent Movie', buttonText: 'Rent Movie' },
  { id: 'claim-offer', label: 'Claim Offer', buttonText: 'Claim Offer' },
  { id: 'reserve', label: 'Reserve', buttonText: 'Reserve' },
  { id: 'apply', label: 'Apply', buttonText: 'Apply Now' },
  { id: 'buy-pass', label: 'Buy Pass', buttonText: 'Buy Pass' },
  { id: 'pledge', label: 'Group Pledge', buttonText: 'Pledge Now' },
  { id: 'start-group', label: 'Start Group', buttonText: 'Start Group' },
  { id: 'join-group', label: 'Join Group', buttonText: 'Join Group' },
  { id: 'bulk-buy', label: 'Bulk Buy', buttonText: 'Order in Bulk' },
  { id: 'split', label: 'Split Cost', buttonText: 'Split & Pay' },
  { id: 'refer-earn', label: 'Refer & Earn', buttonText: 'Invite & Save' },
  { id: 'unlock', label: 'Unlock Deal', buttonText: 'Unlock Group Deal' }
];

export const getTransactionButtonText = (transactionId?: string, defaultAction: string = 'KINNE!') => {
  if (!transactionId) return defaultAction;
  const match = TRANSACTION_TYPES.find(t => t.id === transactionId);
  return match ? match.buttonText.toUpperCase() : defaultAction;
};

export const DOMAINS: Domain[] = [
  { id: 'kinne', name: 'Kinne Ki Nakinne?', label: 'Buy or Not to Buy (Shopping)', primaryAction: 'KINNE!', segments: [
    { id: 'products', label: 'Products', color: 'emerald', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy', 'reserve'] },
    { id: 'wholesale', label: 'Wholesale', color: 'blue', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy', 'pre-order'] },
    { id: 'second-hand', label: 'Second Hand', color: 'amber', defaultTransactionType: 'buy-used', allowedTransactionTypes: ['buy-used', 'rent', 'swap'] },
    { id: 'group-purchase', label: 'Group Purchase', color: 'violet', defaultTransactionType: 'pledge', allowedTransactionTypes: ['pledge', 'start-group', 'join-group', 'bulk-buy', 'split', 'refer-earn', 'unlock'] }
  ]},
  { id: 'line', name: 'Line Ki Naline?', label: 'Take or Not to Take (Real Estate & Rentals)', primaryAction: 'LINE!', segments: [
    { id: 'realestate', label: 'Real Estate', color: 'blue', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy', 'rent'] },
    { id: 'rentals', label: 'Rentals', color: 'indigo', defaultTransactionType: 'rent', allowedTransactionTypes: ['rent', 'book'] },
    { id: 'offers', label: 'Offers', color: 'pink', defaultTransactionType: 'claim-offer', allowedTransactionTypes: ['claim-offer'] },
    { id: 'services', label: 'Services', color: 'teal', defaultTransactionType: 'book', allowedTransactionTypes: ['book', 'apply', 'rent'] }
  ]},
  { id: 'boli', name: 'Boli Lagaune Ki Nalagaune?', label: 'Live Auction', primaryAction: 'BID!', segments: [
    { id: 'live-auction', label: 'Live Auction', color: 'rose', defaultTransactionType: 'auction', allowedTransactionTypes: ['auction'] }
  ]},
  { id: 'khane', name: 'Khane Ki Nakhane?', label: 'Eat or Not to Eat (Food)', primaryAction: 'KHANE!', segments: [
    { id: 'delivery', label: 'Delivery', color: 'orange', defaultTransactionType: 'order', allowedTransactionTypes: ['order'] },
    { id: 'dine-in', label: 'Dine-in', color: 'red', defaultTransactionType: 'book-table', allowedTransactionTypes: ['book-table', 'pre-order'] },
    { id: 'recipe', label: 'Ingredients / Recipe', color: 'yellow', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy', 'subscribe'] },
    { id: 'groceries', label: 'Groceries', color: 'emerald', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy', 'subscribe'] }
  ]},
  { id: 'jane', name: 'Jane Ki Najane?', label: 'Go or Not to Go (Travel)', primaryAction: 'JANE!', segments: [
    { id: 'destinations', label: 'Destinations', color: 'blue', defaultTransactionType: 'book', allowedTransactionTypes: ['book'] },
    { id: 'hotels', label: 'Hotels / Stays', color: 'cyan', defaultTransactionType: 'book', allowedTransactionTypes: ['book'] },
    { id: 'events', label: 'Events', color: 'purple', defaultTransactionType: 'register', allowedTransactionTypes: ['register', 'book', 'claim-offer'] }
  ]},
  { id: 'herne', name: 'Herne Ki Naherne?', label: 'Watch or Not to Watch (Entertainment)', primaryAction: 'HERNE!', segments: [
    { id: 'movies', label: 'Movies', color: 'indigo', defaultTransactionType: 'watch', allowedTransactionTypes: ['rent-movie', 'buy', 'watch', 'subscribe'] },
    { id: 'series', label: 'Series', color: 'violet', defaultTransactionType: 'subscribe', allowedTransactionTypes: ['rent-movie', 'buy', 'watch', 'subscribe'] },
    { id: 'anime', label: 'Anime', color: 'pink', defaultTransactionType: 'subscribe', allowedTransactionTypes: ['rent-movie', 'buy', 'watch', 'subscribe'] },
    { id: 'sports', label: 'Sports', color: 'blue', defaultTransactionType: 'buy-pass', allowedTransactionTypes: ['buy-pass', 'subscribe'] }
  ]},
  { id: 'garne', name: 'Garne Ki Nagarne?', label: 'Do or Not to Do (Career/Business)', primaryAction: 'GARNE!', segments: [
    { id: 'investment', label: 'Investment', color: 'teal', defaultTransactionType: 'register', allowedTransactionTypes: ['register', 'apply'] },
    { id: 'job', label: 'Job', color: 'emerald', defaultTransactionType: 'apply', allowedTransactionTypes: ['apply'] },
    { id: 'hire', label: 'Hire', color: 'green', defaultTransactionType: 'apply', allowedTransactionTypes: ['apply'] }
  ]},
  { id: 'khelne', name: 'Khelne Ki Nakhelne?', label: 'Play or Not to Play (Gaming/Sports)', primaryAction: 'KHELNE!', segments: [
    { id: 'game', label: 'Game', color: 'indigo', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy', 'subscribe', 'rent'] },
    { id: 'sports', label: 'Sports', color: 'blue', defaultTransactionType: 'book', allowedTransactionTypes: ['book', 'rent', 'enroll'] },
    { id: 'events', label: 'Events', color: 'purple', defaultTransactionType: 'register', allowedTransactionTypes: ['register', 'buy-pass', 'claim-offer'] }
  ]},
  { id: 'padhne', name: 'Padhne Ki Napadhne?', label: 'Study or Not to Study (Education)', primaryAction: 'PADHNE!', segments: [
    { id: 'course', label: 'Course', color: 'blue', defaultTransactionType: 'enroll', allowedTransactionTypes: ['buy', 'enroll', 'subscribe'] },
    { id: 'school-college', label: 'School / Colleges', color: 'indigo', defaultTransactionType: 'apply', allowedTransactionTypes: ['enroll', 'apply'] },
    { id: 'learning-materials', label: 'Learning Materials', color: 'cyan', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy', 'rent'] }
  ]},
  { id: 'lagaune', name: 'Lagaune Ki Nalagaune?', label: 'Wear or Not to Wear (Wearables/Accessories)', primaryAction: 'LAGAUNE!', segments: [
    { id: 'cloths', label: 'Cloths', color: 'pink', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy', 'pre-order'] },
    { id: 'accessories', label: 'Accessories', color: 'orange', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy', 'rent'] },
    { id: 'shoes', label: 'Shoes', color: 'amber', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy'] }
  ]}
];
