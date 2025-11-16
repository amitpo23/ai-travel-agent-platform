import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Agent Management (Admin only)
  agents: router({
    list: adminProcedure.query(async ({ ctx }) => {
      // Admin can see all agents, regular users see only their own
      if (ctx.user.role === 'admin') {
        return db.getAllAgents();
      }
      return db.getAgentsByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const agent = await db.getAgentById(input.id);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        
        // Check ownership
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return agent;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        agentType: z.enum(['travelAgent', 'hotelBot']),
        hotelName: z.string().optional(),
        agencyName: z.string().optional(),
        description: z.string().optional(),
        personality: z.string().optional(),
        tone: z.string().default('friendly and professional'),
        avatarUrl: z.string().optional(),
        systemPrompt: z.string().min(1),
        defaultLanguage: z.string().default('en'),
        allowedTools: z.array(z.string()).optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createAgent({
          ...input,
          userId: ctx.user.id,
          allowedTools: input.allowedTools || null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        agentType: z.enum(['travelAgent', 'hotelBot']).optional(),
        hotelName: z.string().optional(),
        agencyName: z.string().optional(),
        description: z.string().optional(),
        personality: z.string().optional(),
        tone: z.string().optional(),
        avatarUrl: z.string().optional(),
        systemPrompt: z.string().optional(),
        defaultLanguage: z.string().optional(),
        allowedTools: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        
        // Check ownership
        const agent = await db.getAgentById(id);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const updated = await db.updateAgent(id, updates);
        if (!updated) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update agent' });
        }
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Check ownership
        const agent = await db.getAgentById(input.id);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        await db.deleteAgent(input.id);
        return { success: true };
      }),
  }),

  // Knowledge Base Management
  knowledgeBases: router({
    listByAgent: protectedProcedure
      .input(z.object({ agentId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Check agent ownership
        const agent = await db.getAgentById(input.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return db.getKnowledgeBasesByAgentId(input.agentId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const kb = await db.getKnowledgeBaseById(input.id);
        if (!kb) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge base not found' });
        }
        
        // Check agent ownership
        const agent = await db.getAgentById(kb.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return kb;
      }),

    create: protectedProcedure
      .input(z.object({
        agentId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check agent ownership
        const agent = await db.getAgentById(input.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return db.createKnowledgeBase(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        
        // Check ownership
        const kb = await db.getKnowledgeBaseById(id);
        if (!kb) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge base not found' });
        }
        
        const agent = await db.getAgentById(kb.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const updated = await db.updateKnowledgeBase(id, updates);
        if (!updated) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update knowledge base' });
        }
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Check ownership
        const kb = await db.getKnowledgeBaseById(input.id);
        if (!kb) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge base not found' });
        }
        
        const agent = await db.getAgentById(kb.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        await db.deleteKnowledgeBase(input.id);
        return { success: true };
      }),
  }),

  // Knowledge Items Management
  knowledgeItems: router({
    listByKnowledgeBase: protectedProcedure
      .input(z.object({ knowledgeBaseId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Check ownership
        const kb = await db.getKnowledgeBaseById(input.knowledgeBaseId);
        if (!kb) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge base not found' });
        }
        
        const agent = await db.getAgentById(kb.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return db.getKnowledgeItemsByKnowledgeBaseId(input.knowledgeBaseId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const item = await db.getKnowledgeItemById(input.id);
        if (!item) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge item not found' });
        }
        
        // Check ownership through KB -> Agent chain
        const kb = await db.getKnowledgeBaseById(item.knowledgeBaseId);
        if (!kb) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge base not found' });
        }
        
        const agent = await db.getAgentById(kb.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return item;
      }),

    create: protectedProcedure
      .input(z.object({
        knowledgeBaseId: z.number(),
        title: z.string().min(1),
        content: z.string().min(1),
        metadata: z.record(z.string(), z.unknown()).nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check ownership
        const kb = await db.getKnowledgeBaseById(input.knowledgeBaseId);
        if (!kb) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge base not found' });
        }
        
        const agent = await db.getAgentById(kb.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return db.createKnowledgeItem({
          knowledgeBaseId: input.knowledgeBaseId,
          title: input.title,
          content: input.content,
          metadata: input.metadata ?? null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        metadata: z.record(z.string(), z.unknown()).nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        
        // Check ownership
        const item = await db.getKnowledgeItemById(id);
        if (!item) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge item not found' });
        }
        
        const kb = await db.getKnowledgeBaseById(item.knowledgeBaseId);
        if (!kb) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge base not found' });
        }
        
        const agent = await db.getAgentById(kb.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const updated = await db.updateKnowledgeItem(id, updates);
        if (!updated) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update knowledge item' });
        }
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Check ownership
        const item = await db.getKnowledgeItemById(input.id);
        if (!item) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge item not found' });
        }
        
        const kb = await db.getKnowledgeBaseById(item.knowledgeBaseId);
        if (!kb) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge base not found' });
        }
        
        const agent = await db.getAgentById(kb.agentId);
        if (!agent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
        }
        if (ctx.user.role !== 'admin' && agent.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        await db.deleteKnowledgeItem(input.id);
        return { success: true };
      }),
  }),

  // Conversation Management (Public for chat interface)
  conversations: router({
    getOrCreate: publicProcedure
      .input(z.object({
        agentId: z.number(),
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Try to find existing conversation
        let conversation = await db.getConversationBySessionId(input.sessionId);
        
        if (!conversation) {
          // Create new conversation
          conversation = await db.createConversation({
            agentId: input.agentId,
            sessionId: input.sessionId,
            userId: null,
          });
        }
        
        return conversation;
      }),

    getMessages: publicProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return db.getMessagesByConversationId(input.conversationId);
      }),

    addMessage: publicProcedure
      .input(z.object({
        conversationId: z.number(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
        metadata: z.record(z.string(), z.unknown()).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createMessage({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          metadata: input.metadata ?? null,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
