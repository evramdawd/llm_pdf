// maps to /chat/** endpoint
import ChatComponent from '@/components/ChatComponent'
import ChatSideBar from '@/components/ChatSideBar'
import PDFViewer from '@/components/PDFViewer'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  params: { // Params are passed in the props in Next.js
    chatId: string
  }
}

// could've just passed down props here: "=async (props: Props)" -> props.params.chatId. 
// async = server component
const ChatPage = async ({params: {chatId}}: Props) => { 
  const {userId} = await auth();
  if(!userId) {
    return redirect('/sign-in');
  };
  
  // Get list of all of the users' chats from DB via drizzle orm:
  const _chats = await db.select().from(chats).where(eq(chats.userId, userId)); // chats from schema

  // If _chats is empty, redirect to main:
  if(!_chats) {
    return redirect('/');
  };

  // Couldn't find a valid chatId w/in the users' chats:
  if(!_chats.find(chat => chat.id === parseInt(chatId))) {
    return redirect('/');
  };

  // Get the PDF_url of the currently selected PDF for <PDFViewer/> Component
  const currentChat = _chats.find(chat => chat.id === parseInt(chatId));

  return (
    <div className='flex max-h-screen overflow-scroll'>
      <div className='flex w-full max-h-screen overflow-scroll'>
        {/* Chat Sidebar - flex-[1] = 1 unit of space */}
        <div className='flex-[1] max-w-xs'>
          <ChatSideBar chats={_chats} chatId={parseInt(chatId)}/>

        </div>

        {/* PDF Viewer */}
        <div className='max-h-screen p-4 overflow-scroll flex-[5]'>
          <PDFViewer pdf_url={currentChat?.pdfUrl || ''}/> {/*If none, then ''*/}

        </div>

        {/* Chat Component */}
        <div className='flex-[3] border-l-4 border-l-slate-200'>
          <ChatComponent chatId={parseInt(chatId)}/>
        </div>
      </div>
    </div>
  )
}

export default ChatPage;