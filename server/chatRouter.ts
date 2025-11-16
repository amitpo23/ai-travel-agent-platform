import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import * as mediciApi from "./mediciApi";

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

// Define tools for LLM
const hotelSearchTool = {
  type: "function" as const,
  function: {
    name: "search_hotels",
    description: "Search for available hotel rooms with pricing. Use this when the user asks about hotel availability, prices, or wants to find a room in a specific city.",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City or destination to search for hotels (e.g., 'Dubai', 'Tel Aviv', 'New York')",
        },
        dateFrom: {
          type: "string",
          description: "Check-in date in YYYY-MM-DD format",
        },
        dateTo: {
          type: "string",
          description: "Check-out date in YYYY-MM-DD format",
        },
        adults: {
          type: "number",
          description: "Number of adults (default: 2)",
        },
        children: {
          type: "array",
          items: { type: "number" },
          description: "Array of children ages (empty array if no children)",
        },
      },
      required: ["city", "dateFrom", "dateTo"],
    },
  },
};

const preBookTool = {
  type: "function" as const,
  function: {
    name: "prebook_room",
    description: "Pre-book a room to confirm availability before final booking. Use this after the user selects a specific room from search results.",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Room code from search results",
        },
        hotelId: {
          type: "string",
          description: "Hotel ID from search results",
        },
        dateFrom: {
          type: "string",
          description: "Check-in date in YYYY-MM-DD format",
        },
        dateTo: {
          type: "string",
          description: "Check-out date in YYYY-MM-DD format",
        },
        adults: {
          type: "number",
          description: "Number of adults",
        },
      },
      required: ["code", "hotelId", "dateFrom", "dateTo", "adults"],
    },
  },
};

const bookRoomTool = {
  type: "function" as const,
  function: {
    name: "book_room",
    description: "Complete the booking with customer details. Use this only after pre-booking and when you have all customer information.",
    parameters: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Token from pre-book response",
        },
        code: {
          type: "string",
          description: "Room code from search",
        },
        hotelId: {
          type: "string",
          description: "Hotel ID",
        },
        dateFrom: {
          type: "string",
          description: "Check-in date",
        },
        dateTo: {
          type: "string",
          description: "Check-out date",
        },
        customerFirstName: {
          type: "string",
          description: "Customer first name",
        },
        customerLastName: {
          type: "string",
          description: "Customer last name",
        },
        customerEmail: {
          type: "string",
          description: "Customer email",
        },
        customerPhone: {
          type: "string",
          description: "Customer phone",
        },
        customerAddress: {
          type: "string",
          description: "Customer address",
        },
        customerCity: {
          type: "string",
          description: "Customer city",
        },
        customerCountry: {
          type: "string",
          description: "Customer country code (e.g., 'IL')",
        },
        customerZip: {
          type: "string",
          description: "Customer zip code",
        },
        adults: {
          type: "number",
          description: "Number of adults",
        },
      },
      required: [
        "token",
        "code",
        "hotelId",
        "dateFrom",
        "dateTo",
        "customerFirstName",
        "customerLastName",
        "customerEmail",
        "customerPhone",
        "customerAddress",
        "customerCity",
        "customerCountry",
        "customerZip",
        "adults",
      ],
    },
  },
};

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

  // Send message and get response (with tool calling support)
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

        // Build system prompt with knowledge and tools
        const systemPrompt = `${agent.systemPrompt}${knowledgeContext}

Agent Type: ${agent.agentType === 'travelAgent' ? 'Travel Agent' : 'Hotel Concierge'}
${agent.hotelName ? `Hotel: ${agent.hotelName}` : ''}
${agent.agencyName ? `Agency: ${agent.agencyName}` : ''}
Personality: ${agent.personality || agent.tone}
Language: ${agent.defaultLanguage}

Instructions:
- Be helpful, friendly, and professional
- Use the knowledge base information to answer questions accurately
- When users ask about hotel availability or prices, use the search_hotels tool
- When users want to book a room, first use prebook_room, then ask for customer details, then use book_room
- Always confirm booking details with the user before completing the booking
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

        // Call LLM with tools
        let response = await invokeLLM({
          messages: llmMessages,
          tools: [hotelSearchTool, preBookTool, bookRoomTool],
          tool_choice: "auto",
        });

        let finalResponse = "";
        let toolCalls = response.choices[0]?.message?.tool_calls;

        // Handle tool calls
        if (toolCalls && toolCalls.length > 0) {
          const toolResults: any[] = [];

          for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            let toolResult: any = null;

            try {
              if (functionName === "search_hotels") {
                const searchResult = await mediciApi.searchHotelPrice({
                  dateFrom: functionArgs.dateFrom,
                  dateTo: functionArgs.dateTo,
                  city: functionArgs.city,
                  pax: [{
                    adults: functionArgs.adults || 2,
                    children: functionArgs.children || [],
                  }],
                  ShowExtendedData: true,
                });

                toolResult = {
                  success: true,
                  data: searchResult.items?.slice(0, 5) || [], // Limit to top 5 results
                };
              } else if (functionName === "prebook_room") {
                const preBookRequest = mediciApi.buildPreBookRequest(
                  functionArgs.code,
                  {
                    dateFrom: functionArgs.dateFrom,
                    dateTo: functionArgs.dateTo,
                    hotelId: functionArgs.hotelId,
                    pax: [{ adults: functionArgs.adults || 2, children: [] }],
                  }
                );

                const preBookResult = await mediciApi.preBookRoom(preBookRequest);
                toolResult = {
                  success: true,
                  data: preBookResult,
                };
              } else if (functionName === "book_room") {
                const bookRequest = mediciApi.buildBookRequest(
                  functionArgs.token,
                  functionArgs.code,
                  {
                    title: "MR",
                    firstName: functionArgs.customerFirstName,
                    lastName: functionArgs.customerLastName,
                    email: functionArgs.customerEmail,
                    phone: functionArgs.customerPhone,
                    address: functionArgs.customerAddress,
                    city: functionArgs.customerCity,
                    country: functionArgs.customerCountry,
                    state: functionArgs.customerCountry,
                    zip: functionArgs.customerZip,
                  },
                  [
                    {
                      adults: Array.from({ length: functionArgs.adults }, (_, i) => ({
                        lead: i === 0,
                        title: "MR",
                        firstName: i === 0 ? functionArgs.customerFirstName : `Guest${i + 1}`,
                        lastName: functionArgs.customerLastName,
                      })),
                      children: [],
                    },
                  ],
                  {
                    dateFrom: functionArgs.dateFrom,
                    dateTo: functionArgs.dateTo,
                    hotelId: functionArgs.hotelId,
                  }
                );

                const bookResult = await mediciApi.bookRoom(bookRequest);
                toolResult = {
                  success: true,
                  data: bookResult,
                };

                // Save booking to database
                await db.createBooking({
                  conversationId: input.conversationId,
                  agentId: agent.id,
                  bookingType: "hotel",
                  hotelName: functionArgs.hotelName || "Unknown",
                  checkInDate: new Date(functionArgs.dateFrom),
                  checkOutDate: new Date(functionArgs.dateTo),
                  guestCount: functionArgs.adults,
                  totalPrice: 0, // Will be updated from response
                  currency: "USD",
                  status: "confirmed",
                  bookingData: bookResult as Record<string, unknown>,
                });
              }
            } catch (error) {
              console.error(`Tool ${functionName} error:`, error);
              toolResult = {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }

            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool" as const,
              name: functionName,
              content: JSON.stringify(toolResult),
            });
          }

          // Call LLM again with tool results
          const followUpMessages = [
            ...llmMessages,
            response.choices[0].message,
            ...toolResults,
          ];

          const followUpResponse = await invokeLLM({
            messages: followUpMessages,
          });

          const followUpContent = followUpResponse.choices[0]?.message?.content;
          if (typeof followUpContent === 'string') {
            finalResponse = followUpContent;
          } else if (Array.isArray(followUpContent)) {
            finalResponse = followUpContent
              .filter(item => item.type === 'text')
              .map(item => (item as any).text)
              .join('\n');
          } else {
            finalResponse = "I apologize, but I couldn't process that request.";
          }
        } else {
          // No tool calls, use direct response
          const messageContent = response.choices[0]?.message?.content;
          if (typeof messageContent === 'string') {
            finalResponse = messageContent;
          } else if (Array.isArray(messageContent)) {
            // Handle array of content (TextContent | ImageContent | FileContent)
            finalResponse = messageContent
              .filter(item => item.type === 'text')
              .map(item => (item as any).text)
              .join('\n');
          } else {
            finalResponse = 'I apologize, but I was unable to generate a response. Please try again.';
          }
        }

        // Save assistant message
        const assistantMessage = await db.createMessage({
          conversationId: input.conversationId,
          role: 'assistant',
          content: finalResponse,
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
