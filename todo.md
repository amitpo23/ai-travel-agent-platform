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
- [ ] Build public chat interface for end users
- [ ] Integrate LLM with agent context and system prompts
- [ ] Implement knowledge base retrieval (RAG mockup)
- [ ] Add streaming chat responses
- [ ] Implement conversation history persistence
- [ ] Add agent type-specific behavior (Travel Agent vs Hotel Concierge)

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
