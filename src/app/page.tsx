import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { UserButton, auth } from '@clerk/nextjs'
import Link from 'next/link';
import {ArrowRight, LogIn} from 'lucide-react'
import FileUpload from '@/components/FileUpload';
import { chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';

// Mark the function async to make it a SERVER COMPONENT
export default async function Home() {
  const {userId} = await auth();
  const isAuth = !!userId; // convert string or null output of userId into a boolean

  // Get 1st Chat (to link via "Go to Chats" Button):
  let firstChat;
  if(userId) {
    firstChat = await db.select().from(chats).where(eq(chats.userId, userId));
    if(firstChat) { // if firstChat exists, then set it equal to 1st in array from db
      firstChat = firstChat[0];
    }
  }

  return (
    <div className='w-screen min-h-screen bg-gradient-to-r from-indigo-200 via-red-200 to-yellow-100'>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className='flex items-center w-900'>
            <h1 className='mr-4 text-5xl font-semibold w-max'>Let&apos;s Chat About Your PDF</h1>
            <UserButton afterSignOutUrl='/'/>
          </div>
        
        <div className="flex mt-3">
          {/*If isAuth & firstChat is truthy, show the Button & Link to chat/1stchatID*/}
          {isAuth && firstChat && (
            <Link href={`/chat/${firstChat.id}`}>
              <Button>Go to Chats <ArrowRight className='ml-2'/></Button>
            </Link> 
          )} 
        </div>

        <div className='w-full mt-4 mb-5'>
          {isAuth ? (<FileUpload />) : (
          <Link href='/sign-in'>
            <Button>
              Login to get Started!
              <LogIn className='w-4 h-4 ml-2' />
            </Button>
          </Link>
          )}
        </div>

        <p className='max-w-xl mt-30 text-lg text-slate-600'>
          Get context-specific answers to your questions by uploading any PDF and querying the LLM. Avoid hallucinations and get the answers you need quickly.
        </p>
      </div>
    </div>
      {/* <h1 className='text-red-600'>Hello World!</h1>
      <Button>Click Me</Button> */}
    </div>
  )
}
