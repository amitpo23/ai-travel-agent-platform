import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

// Helper to build context from knowledge base
async function buildKnowledgeContext(agentId: number): Promise<string> {
  const knowledgeBases = await db.getKnowledgeBasesByAgentId(agentId);
  
  if (knowledgeBases.length === 0) {
    return "";
  }

  let context = "\n\n=== KNOWLEDGE BASE ===\n";
  
  for (const kb of knowledgeBases) {
    const items = await db.getKnowledgeItemsByKnowledgeBaseId(kb.id);
    
    if (items.length > 0) {
      context += `\n## ${kb.name}\n`;
      if (kb.description) {
        context += `${kb.description}\n`;
      }
      
      for (const item of items) {
        context += `\n### ${item.title}\n${item.content}\n`;
      }
    }
  }
  
  return context;
}

export const chatRouter = router({
  // Initialize or get existing conversation
  initConversation: publicProcedure
    .input(z.object({
      agentId: z.number(),
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const agent = await db.getAgentById(input.agentId);
      if (!agent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }

      if (!agent.isActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Agent is not active' });
      }

      // Get or create conversation
      let conversation = await db.getConversationBySessionId(input.sessionId);
      
      if (!conversation) {
        conversation = await db.createConversation({
          agentId: input.agentId,
          sessionId: input.sessionId,
          userId: null,
        });
      }

      // Get message history
      const messages = await db.getMessagesByConversationId(conversation.id);

      return {
        conversation,
        agent,
        messages,
      };
    }),

  // Send message and get response
  sendMessage: publicProcedure
    .input(z.object({
      conversationId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Get conversation and agent
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
        }

        const agent = await db.getAgentById(conversation.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }

        // Save user message
        await db.createMessage({
          conversationId: input.conversationId,
          role: 'user',
          content: input.message,
        });

        // Get conversation history
        const messageHistory = await db.getMessagesByConversationId(input.conversationId);

        // Build knowledge context
        const knowledgeContext = await buildKnowledgeContext(agent.id);

        // Build system prompt with knowledge
        const systemPrompt = `${agent.systemPrompt}${knowledgeContext}

Agent Type: ${agent.agentType === 'travelAgent' ? 'Travel Agent' : 'Hotel Concierge'}
${agent.hotelName ? `Hotel: ${agent.hotelName}` : ''}
${agent.agencyName ? `Agency: ${agent.agencyName}` : ''}
Personality: ${agent.personality || agent.tone}
Language: ${agent.defaultLanguage}

Instructions:
- Be helpful, friendly, and professional
- Use the knowledge base information to answer questions accurately
- If you don't know something, admit it honestly
- ${agent.agentType === 'travelAgent' 
  ? 'Help customers find the perfect vacation, provide recommendations, and assist with bookings' 
  : 'Assist hotel guests with information about amenities, services, and local recommendations'}`;

        // Prepare messages for LLM
        const llmMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...messageHistory.slice(-10).map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          })),
        ];

        // Call LLM
        const response = await invokeLLM({
          messages: llmMessages,
        });

        // Get response content
        const messageContent = response.choices[0]?.message?.content;
        const fullResponse = typeof messageContent === 'string' 
          ? messageContent 
          : 'I apologize, but I was unable to generate a response. Please try again.';

        // Save assistant message
        const assistantMessage = await db.createMessage({
          conversationId: input.conversationId,
          role: 'assistant',
          content: fullResponse,
        });

        return {
          success: true,
          message: assistantMessage,
        };
      } catch (error) {
        console.error('[Chat] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    }),

  // Get conversation history
  getHistory: publicProcedure
    .input(z.object({
      conversationId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getMessagesByConversationId(input.conversationId);
    }),
});
