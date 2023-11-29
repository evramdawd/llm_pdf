// Feeding context of current PDF as a prompt to the createChatCompletion() function in route.ts in API/CHAT route
import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";


// Two Functions:

// GET_MATCHES_FROM_EMBEDDINGS - takes query vector and searches Pinecone for top 5 similar vectors and return those vectors
export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
  const pinecone = new Pinecone({ 
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!, 
  });
  console.log("Pinecone created: ", pinecone);
  
  const index = await pinecone.Index('llm-pdf');

  try {
    // Need to convert fileKey to ASCII characters for Pinecone to read it. (See utils.ts for this):
    const asciiFileKey = convertToAscii(fileKey);

    const queryResult = await index.query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
      filter: {
        'fileKey': { "$eq": asciiFileKey }
      }
    });
    
    console.log('TOP 5: ', queryResult.matches);
    return queryResult.matches || [];

  } catch (error) {
    console.log('Error Querying Embeddings', error);
    throw error;
  }
}

// GET_CONTEXT - takes in query (the user's question) & filekey (namespace/metadata) and returns 
export async function getContext(query: string, fileKey: string) {
  const queryEmbeddings = await getEmbeddings(query);
  const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

  const qualifyingDocs = matches.filter(match => match.score && match.score > 0.7) // if score exists and is > 70% return it!

  type Metadata = {
    text: string,
    pageNumber: number
  }

  // Get back the actual text of the relevant parts of the PDF which we saved in the Metadata of the Vectors
  let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text);
  
  // Return the relevant text (joining them) (cutting things off past 3000 characters)
  return docs.join('\n').substring(0, 3000)
}