import {OpenAIApi, Configuration} from 'openai-edge';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(config);

// GET-EMBEDDINGS Function Converts Text to Vector via OPENAI API
export async function getEmbeddings(text: string) {
  try {
    console.log('IN GET_EMBEDDINGS!')
    const response = await openai.createEmbedding({
      model: 'text-embedding-ada-002', // 2nd gen embedding model. See docs
      input: text.replace(/\n/g, ' ') // replace all new lines with empty space
    });

    const result = await response.json();
    console.log('RESULT OF CREATE_EMBEDDING: ', result);
    return result.data[0].embedding as number[];
  } catch (error) {
    console.log('Error calling OpenAI Embeddings API', error);
    throw error;
  }
}