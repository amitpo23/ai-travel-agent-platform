import { drizzle } from 'drizzle-orm/mysql2';
import { agents, knowledgeBases, knowledgeItems } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

console.log('🌱 Seeding demo agent...\n');

try {
  // Create a Travel Agent
  const [agent] = await db.insert(agents).values({
    name: 'Sarah - Travel Expert',
    agentType: 'travelAgent',
    agencyName: 'Global Travel Solutions',
    description: 'Expert travel agent specializing in hotel bookings and vacation planning',
    persona: 'Friendly, professional, and knowledgeable about worldwide destinations',
    systemPrompt: `You are Sarah, an expert travel agent. You help customers find and book hotels worldwide.

Your capabilities:
- Search for hotels in any city
- Provide detailed information about hotels, rooms, and prices
- Help customers book rooms
- Answer questions about destinations, travel tips, and policies

Always be friendly, professional, and helpful. When customers ask about hotels, use the search_hotels tool to find real availability and prices.`,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    defaultLanguage: 'en',
    tone: 'professional',
    allowedTools: JSON.stringify(['search_hotels', 'prebook_room', 'book_room']),
    isActive: true,
  }).$returningId();

  console.log('✅ Created agent:', agent.id);

  // Create Knowledge Base
  const [kb] = await db.insert(knowledgeBases).values({
    name: 'Hotel Booking Guide',
    description: 'General knowledge about hotel bookings, policies, and travel tips',
    agentId: agent.id,
  }).$returningId();

  console.log('✅ Created knowledge base:', kb.id);

  // Add Knowledge Items
  const items = [
    {
      title: 'Booking Process',
      content: `Our hotel booking process is simple and secure:

1. Search: Tell me your destination, dates, and number of guests
2. Browse: I'll show you available hotels with real-time prices
3. Select: Choose your preferred hotel and room type
4. Book: Provide your details and confirm the booking
5. Confirmation: You'll receive a booking confirmation immediately

All bookings are processed securely and you'll receive instant confirmation.`,
      type: 'text',
      metadata: JSON.stringify({ category: 'process' }),
      knowledgeBaseId: kb.id,
    },
    {
      title: 'Cancellation Policy',
      content: `Cancellation policies vary by hotel:

- **Fully Refundable**: Cancel anytime before the deadline for a full refund
- **Partially Refundable**: Cancellation fees apply after a certain date
- **Non-Refundable**: No refunds, but often comes with lower prices

Always check the specific cancellation policy before booking. I'll show you the policy for each hotel during search.`,
      type: 'text',
      metadata: JSON.stringify({ category: 'policy' }),
      knowledgeBaseId: kb.id,
    },
    {
      title: 'Payment Methods',
      content: `We accept the following payment methods:

- Credit Cards (Visa, Mastercard, American Express)
- Debit Cards
- Account Credit (for registered users)

All payments are processed securely. Some hotels offer "Pay at Hotel" options where you pay directly at the property.`,
      type: 'text',
      metadata: JSON.stringify({ category: 'payment' }),
      knowledgeBaseId: kb.id,
    },
    {
      title: 'Travel Tips',
      content: `Here are some helpful travel tips:

**Before Booking:**
- Book in advance for better prices
- Check hotel location and nearby attractions
- Read cancellation policies carefully
- Consider travel insurance

**During Your Stay:**
- Arrive during check-in hours (usually 2-4 PM)
- Keep your booking confirmation handy
- Ask about hotel amenities and services
- Report any issues immediately to hotel staff

**Popular Destinations:**
- Tel Aviv: Beach city with vibrant nightlife
- Dubai: Luxury shopping and modern architecture
- Paris: Culture, art, and romantic atmosphere
- New York: The city that never sleeps`,
      type: 'text',
      metadata: JSON.stringify({ category: 'tips' }),
      knowledgeBaseId: kb.id,
    },
  ];

  await db.insert(knowledgeItems).values(items);

  console.log('✅ Created', items.length, 'knowledge items');
  console.log('\n✅ Demo agent seeded successfully!');
  console.log('\nAgent ID:', agent.id);
  console.log('Chat URL: /chat/' + agent.id);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error seeding demo agent:', error);
  process.exit(1);
}
