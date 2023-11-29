// API/CHAT ROUTE:

import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { getContext } from '@/lib/context';
import { db } from '@/lib/db';
import { chats, messages as _messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { Message } from 'ai/react';

export const runtime = 'edge'; // This is where we mark this as an edge function - will make this much faster if deployed to Vercel

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // This is the message that we're posting to ChatGPT from useChat() in ChatComponent
    const { messages, chatId } = body; 
    
    // Get the fileKey from the ChatId -> query the database:
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));

    // If there's more than 1 chat that matches - something went wrong:
    if(_chats.length !== 1) {
      return NextResponse.json({'error': 'chat not found'}, {status: 404});
    }

    // Obtain fileKey from saved Chat in DB (via schema)
    const fileKey = _chats[0].fileKey;

    // Input the context of the PDF
    const lastMessage = messages[messages.length - 1]; // last user message = the query

    // Should return relevant vectors and their Page Contents - then we feed that into the response
    const context = await getContext(lastMessage.content, fileKey);
                                      //****** LOOK HERE  - REMOVE FOR A KNOWN BREAK ******* */
    const prompt = {
      role: 'system',
      content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      AI assistant will end every response with '- Your Friendly Neighborhood AI`,
    };

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        // Pass in prompt & ALL the messages that the user sent (saving token space)
        prompt,
        ...messages.filter((message: Message) => message.role === 'user')
      ],
      stream: true // It'll stream the response (ChatGPT style)

    })

    // Create the stream response (answer from GPT):
    const stream = OpenAIStream(response, {
      onStart: async () => {
        // Save our user's prompt into our db (via drizzle orm):
        await db.insert(_messages).values({
          chatId,
          content: lastMessage.content, // user's query from above
          role: 'user'
        })
      },

      onCompletion: async (content: string) => {
        // Save GPT's response to prompt also in drizzle:
        await db.insert(_messages).values({
          chatId,
          content,
          role: 'system'
        })
      }
    });

    return new StreamingTextResponse(stream);

  } catch (error) {
    console.log(error);
  }
}