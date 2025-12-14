export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venueId: string;
  venueType: 'cinema' | 'stadium' | 'cafe'; // Added for display purposes
  image?: string;
}

export const mockEvents: Event[] = [
  // Theater / Stadium Events
  {
    id: 'evt-001',
    title: 'Summer Music Festival',
    description: 'Join us for a night of amazing music under the stars. Featuring top artists from around the globe.',
    date: '2025-07-15',
    time: '19:00',
    venueId: 'venue-stadium-1',
    venueType: 'stadium',
    image: 'https://images.unsplash.com/photo-1459749411177-3c2ea8156daa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'evt-002',
    title: 'Classical Symphony',
    description: 'An evening of timeless masterpieces performed by the City Orchestra.',
    date: '2025-08-05',
    time: '18:30',
    venueId: 'venue-stadium-2',
    venueType: 'stadium',
    image: 'https://images.unsplash.com/photo-1465847899078-b413929f7120?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },

  // Cinema Events
  {
    id: 'evt-003',
    title: 'Sci-Fi Movie Marathon',
    description: 'Back-to-back screening of the greatest sci-fi classics of the 21st century.',
    date: '2025-07-20',
    time: '14:00',
    venueId: 'venue-cinema-1',
    venueType: 'cinema',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'evt-004',
    title: 'Indie Film Premiere',
    description: 'Exclusive premiere of the award-winning indie film "The Last Horizon". Q&A with director follows.',
    date: '2025-07-25',
    time: '20:00',
    venueId: 'venue-cinema-2',
    venueType: 'cinema',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },

  // Restaurant / Cafe Events
  {
    id: 'evt-005',
    title: 'Comedy Night Special',
    description: 'Prepare to laugh until it hurts! A lineup of the funniest stand-up comedians in an intimate setting.',
    date: '2025-07-22',
    time: '20:00',
    venueId: 'venue-cafe-1',
    venueType: 'cafe',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'evt-006',
    title: 'Jazz & Wine Tasting',
    description: 'Smooth jazz and fine wine. The perfect relaxing evening.',
    date: '2025-08-10',
    time: '19:30',
    venueId: 'venue-cafe-2',
    venueType: 'cafe',
    image: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];
