import { ChatOpenAI } from "@langchain/openai";
import { Config } from "sst/node/config";

export const OPENAI_4O_MINI = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  apiKey: Config.OPENAI_API_KEY,
});
