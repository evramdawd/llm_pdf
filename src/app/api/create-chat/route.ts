// Maps to endpoint: /api/create-chat
import { db } from "@/lib/db"
import { chats } from "@/lib/db/schema"
import { auth } from '@clerk/nextjs'
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  console.log('IN THE POST REQUEST!');
  // Get current user:
  const {userId} = await auth();
  // Check if !userID:
  if(!userId) { // i.e. user is not logged in
    return NextResponse.json({error: 'unauthorized'}, {status: 401})
  }

  try {
    console.log('IN THE TRY BLOCK!');
    const body = await req.json();
    const {file_key, file_name} = body;
    console.log('file_key, file_name', file_key, file_name);

    // LOAD S3 INTO PINECONE:
    const pages = await loadS3IntoPinecone(file_key);
    console.log('Succfully executed loadS3IntoPinecone()!');

    // Create a new chat within our Database:
    const chat_id = await db.insert(chats).values({ // returns an array of ALL the inserted values
      fileKey: file_key,
      pdfName: file_name,
      pdfUrl: getS3Url(file_key),
      userId, 
    }).returning({ // returning the inserted chat's ID
      insertedId: chats.id,
    });

    // Returning just the last inserted chat_id from drizzle ORM
    return NextResponse.json({
      chat_id: chat_id[0].insertedId
    },
    { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {error: 'Internal Server Error'},
      {status: 500}
    );
  }
}