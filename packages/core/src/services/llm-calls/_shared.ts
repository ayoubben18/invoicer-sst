import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Config } from "sst/node/config";

export const OPENAI_4O_MINI = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  apiKey: Config.OPENAI_API_KEY,
});

export const OPENAI_4O = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0,
  apiKey: Config.OPENAI_API_KEY,
});

export const OPENAI_EMBEDDING_MODEL = new OpenAIEmbeddings({
  apiKey: Config.OPENAI_API_KEY,
  model: "text-embedding-3-small",
});
