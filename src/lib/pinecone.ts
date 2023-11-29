import {Pinecone, Vector, PineconeRecord, utils as PineconeUtils, PineconeClient} from '@pinecone-database/pinecone'
import { downloadFromS3 } from './s3-server';
import {PDFLoader} from 'langchain/document_loaders/fs/pdf';
import {Document, RecursiveCharacterTextSplitter} from '@pinecone-database/doc-splitter';
import { getEmbeddings } from './embeddings';
import md5 from 'md5';
import { convertToAscii } from './utils';
import { VectorOperationsApi } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';

// let pinecone: PineconeClient | null = null;
let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
  if(!pinecone) {
    // pinecone = new PineconeClient(); // deprecated??
    console.log('Pinecone is falsey - need to create it');
    pinecone = new Pinecone({ 
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!, 
    });
    console.log("Pinecone created: ", pinecone);
    //Using PineconeClient() which seems to have been deprecated...
    // await pinecone.init({ // Initialize pinecone with environment and api_key
    //   environment: process.env.PINECONE_ENVIRONMENT!, // ! operator to tell TS that it exists 
    //   apiKey: process.env.PINECONE_API_KEY!
    // });
  }
  return pinecone;
}

/* Pinecone Steps
1. Obtain the PDF from S3
2. Split & Segment the PDF into smaller Internal Documents
3. Vectorise and embed individual documents
4. Store the vectors (embeddings into Pinecone DB)
*/

// Defining a type for "pages" output (returned by loadS3IntoPinecone() )
type PDFPage = {
  pageContent: string;
  metadata: {
    loc: {pageNumber: number}
  }
}

/* Order of Operations: (1) Obtain PDF from S3 & Read PDF w PDFLoader. (2) Split & Segment the PDF (Recrusive Character Text Splitter & Truncate) (3) Vectorize and Embed Individual Docs (4) Upload Vectors to Pinecone */

// LOAD PDF INTO PINECONE:
export async function loadS3IntoPinecone(fileKey: string) {
  // This function will be called in the POST request in route.ts
  // 1. Obtain the PDF from S3 --> download & read from pdf
  console.log('Downloading PDF from S3 into tmp Folder');
  const file_name = await downloadFromS3(fileKey);

  // catch any error in case PDF could not be downloaded from S3.
    // if we didn't have this, file_name argument in PDFLoader below would throw a TS error
  if(!file_name) {
    throw new Error('could not download from S3');
  }
  const loader = new PDFLoader(file_name);
  
  // Pages will be an array of objects, each object containing a segmented part of the PDF and metadata associated with that part
  const pages = (await loader.load()) as PDFPage[]; // pages: array of PDFPage-Objects

  // 2. Split & Segment the PDF (prepareDocument())
    // e.g. 13pg doc -> pages = Array(13 objects) -> prepareDocument() -> pages = Array(100+ objects)
  const documents = await Promise.all(pages.map((page) => prepareDocument(page))); 

  // 3. Vectorize and Embed Individual Documents:
    // Returns an array of Vectors 
  const vectors = await Promise.all(documents.flat().map((doc) => embedDocument(doc, fileKey)));
  console.log('SUCCESFULLY CREATED THE VECTORS. NOW TRYING TO UPLOAD TO PINECONE');
 
  // 4. Upload Vectors to Pinecone
  const client = await getPineconeClient();
  console.log('Successfully found Pinecone Client');
  const pineconeIndex = client.Index("llm-pdf"); // name of the Index set up online
  console.log('Successfully found Pinecone Index: ', pineconeIndex);

  /* Namespaces not available in Pinecone Free Tier anymore! Filtering by Metadata instead:
  // Need to convert fileKey to ASCII characters for Pinecone to read it. (See utils.ts for this):
  const ns = convertToAscii(fileKey); // there's a different namespace for each document
  // Create a client instance scoped to a single namespace:
  const indexNamed = pineconeIndex.namespace(ns); 
  console.log('indexNamed: ', indexNamed);
  */

  console.log('Inserting Vectors into Pinecone');

  // Use built-in utils from Pinecone to help chunk and push vectors into Pinecone Index:
    // chunkedUpsert is deprecated (v0) -> let's manually batch it (Pinecone suggests no more than 100 vectors per upload).
  // PineconeUtils.chunkedUpsert(pineconeIndex, vectors, namespace, 10); // chunk size = 10
  let insertedBatches = [];
  const batchSize = 100;
  console.log("Vectors_Length = ", vectors.length);
  while(vectors.length) {
    let batchedVectors = vectors.splice(0, batchSize);
    console.log('batchedVectors: ', batchedVectors);
    let pineconeResult = await pineconeIndex.upsert(batchedVectors);
    insertedBatches.push(pineconeResult);
  };
  
  console.log('InsertedBatches: ', insertedBatches);
  return insertedBatches[0];
}

// EMBED DOCUMENT (for Step 3)
async function embedDocument(doc: Document, fileKey: string) {
  try {
    console.log('IN EMBED_DOCUMENTS');
    // Invoke getEmbeddings from embeddings.ts. Input: string. Output: array of numbers (VECTOR).
    const embeddings = await getEmbeddings(doc.pageContent);

    // md5 hashing - help to ID the vector w/in Pinecone
    const hash = md5(doc.pageContent);

    // Need to convert fileKey to ASCII characters for Pinecone to read it. (See utils.ts for this):
    const asciiFileKey = convertToAscii(fileKey);

    // Return the Vector - Vector-type comes from Pinecone DB
    return {
      id: hash, 
      values: embeddings,
      metadata: { // comes from our definition of the metadata in "splitDocuments()" below
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
        fileKey: asciiFileKey
      }
    } as PineconeRecord //Vector

  } catch (error) {
    console.log('Error embedding document:', error);
    throw error;
  }
}

// PREPARE_DOCUMENT Function - Further split each PDF Pg. into smaller segments for vectorization:
async function prepareDocument(page: PDFPage) {
  console.log('IN PREPARE_DOCUMENT');
  let {pageContent, metadata} = page; // Metadata of the original PDF
  pageContent = pageContent.replace(/\n/g, ''); // replace all new lines with empty string

  // Split the documents:
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([ // each document = 1 page
    new Document({ // Document type imported above
      pageContent,
      metadata: { // SPECIFY CUSTOM METADATA HERE! - FILTER BY METADATA VS. NAMESPACE
        pageNumber: metadata.loc.pageNumber, // metadata.loc -> metadata of original pdf page
        text: truncateStringByByte(pageContent, 36000), // 36000 byte limit for strings w Pinecone
      }
    })
  ]);
  console.log('PREPARE_DOCUMENT Executed Successfully');
  return docs
};

// Truncating Strings to fit Pinecone DB vector size limitations:
// Input String & #Bytes. Runs UTF-8 encoder, slices it to the # of bytes specified
// Returns decoded truncated string
export const truncateStringByByte = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes));
}