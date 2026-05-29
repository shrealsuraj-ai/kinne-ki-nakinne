export interface Domain {
  id: string;
  name: string;
  label: string;
  primaryAction: string;
  segments: { id: string; label: string; color: string }[];
}

export const DOMAINS: Domain[] = [
  { id: 'kinne', name: 'Kinne Ki Nakinne?', label: 'Buy or Not to Buy (Shopping)', primaryAction: 'KINNE!', segments: [
    { id: 'feed', label: 'Products', color: 'emerald' },
    { id: 'remarket', label: 'Second Hand', color: 'amber' }
  ]},
  { id: 'boli', name: 'Boli Lagaune Ki Nalagaune?', label: 'To Bid or Not to Bid (Live Auctions)', primaryAction: 'BID!', segments: [
    { id: 'arena', label: 'Live Auctions', color: 'rose' }
  ]},
  { id: 'khane', name: 'Khane Ki Nakhane?', label: 'Eat or Not to Eat (Food)', primaryAction: 'KHANE!', segments: [
    { id: 'food', label: 'Food', color: 'orange' },
    { id: 'restaurant', label: 'Restaurant', color: 'red' },
    { id: 'menu', label: 'Menu', color: 'yellow' }
  ]},
  { id: 'jane', name: 'Jane Ki Najane?', label: 'Go or Not to Go (Travel)', primaryAction: 'JANE!', segments: [
    { id: 'places', label: 'Places', color: 'blue' },
    { id: 'hotels', label: 'Hotels', color: 'cyan' },
    { id: 'events', label: 'Events', color: 'purple' }
  ]},
  { id: 'herne', name: 'Herne Ki Naherne?', label: 'Watch or Not to Watch (Entertainment)', primaryAction: 'HERNE!', segments: [
    { id: 'movies', label: 'Movies', color: 'indigo' },
    { id: 'series', label: 'Series', color: 'violet' },
    { id: 'anime', label: 'Anime', color: 'pink' }
  ]},
  { id: 'garne', name: 'Garne Ki Nagarne?', label: 'Do or Not to Do (Career/Business)', primaryAction: 'GARNE!', segments: [
    { id: 'jobs', label: 'Jobs', color: 'teal' },
    { id: 'partnership', label: 'Partnership', color: 'emerald' },
    { id: 'fundraising', label: 'Fund Raising', color: 'green' }
  ]},
  { id: 'khelne', name: 'Khelne Ki Nakhelne?', label: 'Play or Not to Play (Gaming/Sports)', primaryAction: 'KHELNE!', segments: [
    { id: 'games', label: 'Games', color: 'indigo' },
    { id: 'sports', label: 'Sports', color: 'blue' },
    { id: 'events', label: 'Events', color: 'purple' }
  ]},
  { id: 'padhne', name: 'Padhne Ki Napadhne?', label: 'Study or Not to Study (Education)', primaryAction: 'PADHNE!', segments: [
    { id: 'courses', label: 'Courses', color: 'blue' },
    { id: 'schools', label: 'Schools', color: 'indigo' },
    { id: 'consultancy', label: 'Consultancy', color: 'cyan' }
  ]},
  { id: 'lagaune', name: 'Lagaune Ki Nalagaune?', label: 'Wear or Not to Wear (Wearables/Accessories)', primaryAction: 'LAGAUNE!', segments: [
    { id: 'clothes', label: 'Clothes', color: 'pink' },
    { id: 'shoes', label: 'Shoes', color: 'orange' },
    { id: 'accessories', label: 'Accessories', color: 'amber' },
    { id: 'jewelry', label: 'Jewelry', color: 'purple' }
  ]}
];
