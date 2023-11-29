'use client';
import { uploadToS3 } from '@/lib/s3';
import { useMutation } from '@tanstack/react-query';
import { Inbox, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter} from 'next/navigation';

// type props = {}

const FileUpload = () => {
  // Define next/navigation useRouter:
  const router = useRouter();
  
  // Define Uploading state variable:
  const [uploading, setUploading] = useState(false);

  // useMutation - React Query Function that allows us to hit the backend API (while CACHING!)
  const {mutate, isLoading} = useMutation({
    // MutateFn - Async Post request via axios - posting file_key & file_name to PINECONE DB
    mutationFn: async ({file_key, file_name}: {file_key: string, file_name: string}) => {
      const response = await axios.post('/api/create-chat', { // POST REQUEST:
        file_key, 
        file_name
      });
      return response.data;
    },
  });

  // USE_DROPZONE: 
  const { getRootProps, getInputProps } = useDropzone({ //Pass these 2 props into our input field below.
    multiple: true,
    onDragEnter: () => console.log('OnDragEnter WORKS!'), // callback for when drag in the zone
    onDragLeave: undefined,
    onDragOver: undefined,
    accept: { 'application/pdf': ['.pdf']},
    maxFiles: 1,
    onDrop: async (acceptedFile) => {
      console.log('IN ONDROP FUNCTION');
      console.log(acceptedFile);
      const file = acceptedFile[0]

      // File-Size Check: (10MB)
      if(file.size > 10 * 1024 * 1024) { // if filesize > 10MB
        toast.error('Max filesize 10MB');
        // alert('Max filesize 10MB');
        return;
      }
      
      // Uploading to S3 Bucket:
      try {
        // Change state -> true
        setUploading(true);

        // Upload Function in S3.ts (via AWS-sdk) - should return {file_key, file_name}
        const data = await uploadToS3(file);

        // !data?.file_key - The ? checks of the data object is null or undefined. If you didn't include it, you'd get a TS error "data is possible undefined". The ! is to see if the file_key/file_name key on the data object is null or undefined.
        if(!data?.file_key || !data.file_name) {
          toast.error('Something went wrong. Either file_key or file_name was not successfully uploaded to S3');
          // alert('Something went wrong. Either file_key or file_name was not successfully uploaded to S3')
          return;
        }

        // Invoke the mutate function (defined above) which will create a POST request to upload to PINECONE DB:
        mutate(data, {
          // If function runs successfully, then Redirect user to the Chat Page
          onSuccess: ({chat_id}) => {
            console.log('chat_id: ', chat_id); // POST req should return {pages} from route.ts 
            toast.success('Chat has been successfully created!');
            router.push(`/chat/${chat_id}`);
          },
          onError: (err) => {
            console.log('DOA :/');
            console.error(err);
            toast.error('Error creating chat');
          },
        });
      } catch (error) {
          console.log(error);
      } finally {
        setUploading(false); // No matter what happens, uploading is set back to false.
      }
    },
  });

  // RENDERING:
  return (
    <div className='p-2 bg-white rounded-xl'>
      <div {...getRootProps({
        className: 'border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col'})}
      >
      <input {...getInputProps()} type='file'/>
      {/* uploading=true when uploading to S3 
        & isLoading=true when sending file_key/file_name to backend */}
      {(uploading || isLoading) ? (
        <>
          {/* Loading Status */}
          <Loader2 className='h-10 w-10 text-blue-500 animate-spin'/>
          <p className='mt-2 text-sm text-slate-400'>
            Spilling Tea to GPT...
          </p>
        </>
      ) : (
        <>
          <Inbox className='w-10 h-10 text-blue-500' /> {/* <>...</> = Fragment */}
          <p className='mt-2 text-sm text-slate-400'>Drop PDF Here</p>
        </>
      )} 
      
      </div>
    </div>
  )
}

export default FileUpload