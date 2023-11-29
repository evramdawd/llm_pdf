'use client';
import React from 'react'
import { Input } from './ui/input'
import { useChat } from 'ai/react';
import { Button } from './ui/button';
import { Send } from 'lucide-react';
import MessageList from './MessageList';
import { Message } from 'ai';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

type Props = {chatId: number}

const ChatComponent = ({chatId}: Props) => {
  // useChat - Vercel AI - create streaming UI (a la ChatGPT)
  // Messages - array of messages. useChat() allows us to loop through messages and display
  // useChat() paramater api: API endpoint that accepts a { messages: Message[] } object and returns a stream of tokens of the AI chat response. Defaults to /api/chat.
  const {input, handleInputChange, handleSubmit, messages} = useChat({
    // api:'api/chat', // this endpoint is the default - didn't work initially when explicitly written out
    body: {
      chatId
    }
  }); 

  // Auto-scroll to bottom of Message, everytime the message changes:
  React.useEffect(() => {
    const messageContainer = document.getElementById('message-container');
    if(messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: 'smooth' // Dope!
      });
    }
  });

  return (
    <div className='relative max-h-screen overflow-scroll' id='message-container'>
      {/* header */}
      <div className='sticky top-0 inset-x-0 p-2 bg-white h-fit'>
        <h3 className='text-xl font-bold'>Chat</h3>
      </div>

      {/* message list */}
      <MessageList messages={messages}/>

    <form onSubmit={handleSubmit} className='sticky bottom-0 inset-x-0 px-2 py-4 bg-white'>
      <div className="flex">
        <Input value={input} onChange={handleInputChange} placeholder='Ask any question...' className='w-full'/>
        <Button className='bg-blue-600 ml-2'>
          <Send className='h-4 w-4'/>
        </Button>
      </div>
    </form>
    </div>
  )
}

export default ChatComponent