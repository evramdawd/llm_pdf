import AWS from 'aws-sdk';

// UPLOAD TO S3 FUNCTION:
export async function uploadToS3(file: File) {
  try {
    // Getting access to the S3 Bucket:
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
    });
    const s3 = new AWS.S3({
      params: {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME
      },
      region: 'us-east-1'
    });

    // Uploading to 'uploads' folder in S3 bucket. Adding timestamp to make it unique. Replacing spaces in name with dashes(-).
    const file_key = 'uploads/' + Date.now().toString() + file.name.replace(' ', '-');

    const params = {
      // Put the bang after BUCKET NAME because interface for Bucket is string | undefined. Putting the bang here tells TS that it definitely exists (i.e. will not be undefined)
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!, 
      Key: file_key, // Uniquely identifiable name of the file.
      Body: file
    };

    // UPLOAD TO S3
    const upload = s3.putObject(params).on('httpUploadProgress', evt => {
      console.log('Uploading to S3...', parseInt(((evt.loaded*100)/evt.total).toString()) + '%')
    }).promise();

    await upload.then(data => {
      console.log('Successfully uploaded to S3!', file_key)
    });

    // This is an async function - need to resolve the Promise
    return Promise.resolve({
      file_key,
      file_name: file.name,
    });
  } catch (error) {
    console.log(error);
  }
}

export function getS3Url(file_key: string) {
  // Need to check this!! Might have mistyped 
  const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${file_key}`;
  
  return url;
}