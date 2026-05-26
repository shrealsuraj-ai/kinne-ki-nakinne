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
    { id: 'arena', label: 'Auction', color: 'rose' },
    { id: 'remarket', label: 'Second Hand', color: 'amber' }
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
  { id: 'padhne', name: 'Padhne Ki Napadhne?', label: 'Study or Not to Study (Education)', primaryAction: 'PADHNE!', segments: [
    { id: 'courses', label: 'Courses', color: 'blue' },
    { id: 'schools', label: 'Schools', color: 'indigo' },
    { id: 'consultancy', label: 'Consultancy', color: 'cyan' }
  ]}
];
