import { OPENAI_EMBEDDING_MODEL } from "./_shared";

export const embedText = async (text: string) => {
  const embeddings = await OPENAI_EMBEDDING_MODEL.embedQuery(text);
  return embeddings;
};
