import AWS from 'aws-sdk';
import fs from 'fs';

// DOWNLOAD FROM S3 FUNCTION:
export async function downloadFromS3(file_key: string) {
  // Will take in the file-key and download the PDF onto local computer
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

    // Parameters to access the right PDF in the right S3 Bucket:
    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
    }

    // Download and save PDF to local drive:
    const obj = await s3.getObject(params).promise();
    const file_name = `/tmp/pdf-${Date.now()}.pdf`;
    fs.writeFileSync(file_name, obj.Body as Buffer);
    return file_name;
  } catch (error) {
    console.error(error);
    return null;
  }
}