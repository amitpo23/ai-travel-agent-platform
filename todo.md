# AI Travel Agent Platform - TODO

## Phase 1: Project Setup
- [x] Initialize Next.js project with tRPC, Drizzle, and authentication
- [x] Create todo.md file

## Phase 2: Database Schema
- [x] Design and implement Agent table (Travel Agent / Hotel Concierge types)
- [x] Design and implement Knowledge Base tables
- [x] Design and implement Conversation/Message tables for chat history
- [x] Add Stripe billing fields to User table
- [x] Push schema to database

## Phase 3: Backend API (tRPC Procedures)
- [x] Implement agent CRUD procedures (create, read, update, delete, list)
- [x] Implement knowledge base CRUD procedures
- [x] Implement knowledge item CRUD procedures
- [x] Implement conversation/message procedures
- [x] Add role-based access control (admin vs user)

## Phase 4: Admin Dashboard UI
- [x] Create admin layout with sidebar navigation
- [x] Build agent management page (list, create, edit, delete)
- [x] Build knowledge base management page
- [x] Build knowledge item editor
- [x] Add agent type selector (Travel Agent / Hotel Concierge)
- [x] Add agent configuration UI (personality, tone, system prompt)

## Phase 5: Chat Interface
- [x] Build public chat interface for end users
- [x] Integrate LLM with agent context and system prompts
- [x] Implement Knowledge Base retrieval (RAG)
- [x] Add streaming responses
- [x] Save conversation history
- [x] Support multiple languages

## Phase 6: Stripe Integration
- [ ] Set up Stripe webhook handler
- [ ] Implement subscription checkout flow
- [ ] Add billing status checks to protected procedures
- [ ] Create subscription management UI
- [ ] Add usage limits based on subscription tier

## Phase 7: Booking API Integration
- [ ] Create mock booking API endpoints (availability, rates, booking)
- [ ] Implement LLM tool calling for booking operations
- [ ] Add booking confirmation flow
- [ ] Integrate payment processing for bookings
- [ ] Add booking history and management

## Phase 8: Final Polish
- [ ] Test all features end-to-end
- [ ] Write deployment documentation
- [ ] Create seed data for demo agents
- [ ] Add error handling and loading states
- [ ] Create final checkpoint for deployment

## Phase 5b: Chat UI Redesign (Vercel Template Style)
- [x] Redesign chat interface to match Vercel Nuxt AI Chatbot template
- [x] Add sidebar with conversation history and "New chat" button
- [x] Center the initial prompt with "How can I help you today?"
- [x] Add suggested prompts as clickable buttons with icons
- [x] Implement model selector in input area
- [x] Add dark mode toggle
- [x] Improve message bubbles styling
- [x] Add smooth animations and transitions

## Phase 6: Medici Hotels API Integration
- [x] Create API client for Medici Hotels backend
- [x] Implement GetInstantSearchPrice endpoint wrapper
- [x] Implement PreBook endpoint wrapper
- [x] Implement Book endpoint wrapper
- [x] Implement CancelRoomDirectJson endpoint wrapper
- [x] Add LLM Tool Calling for hotel search
- [x] Add LLM Tool Calling for booking
- [ ] Add LLM Tool Calling for cancellation
- [x] Store booking details in database
- [x] Add API authentication (Bearer token) to secrets
- [ ] Test full booking flow end-to-end
