import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OPENAI_4O, OPENAI_4O_MINI } from "./_shared";

export const determineNewOrOldProvider = async (text: string) => {
  const schema = z.object({
    type: z.enum(["new", "old"]),
  });

  const parser = new StructuredOutputParser(schema);

  const chain = RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(
      `
      You are a specialized text analyzer focused on determining if a provider mention is new or old. Your task is to analyze the input text and return ONLY a JSON object with no additional text or explanation.

Key Indicators for Classification:

NEW Provider:
- Text explicitly introduces or announces a new partnership/supplier
- Contains phrases like "new provider", "pleased to introduce", "announcing our partnership"
- Provides comprehensive company details in an introductory manner

OLD Provider:
- Provider is mentioned in passing or as part of ongoing operations
- Referenced in context of existing relationship or repeat orders
- Contains phrases like "as usual", "brought us more", "our regular supplier"
- No formal introduction or comprehensive company details provided

Output Format:
Return ONLY a JSON object with this exact structure:
{{
    "provider_type": "new" | "old"
}}

Examples:

Example 1 (NEW):
Input: "We are pleased to introduce TechCorp as our new semiconductor supplier. They are based in Taiwan with ISO 9001 certification..."
Output:
{{
    "provider_type": "new"
}}

Example 2 (OLD):
Input: "TechCorp brought us another shipment of semiconductors last week."
Output:
{{
    "provider_type": "old"
}}

Example 3 (OLD):
Input: "Our regular supplier TechCorp will handle the order as usual."
Output:
{{
    "provider_type": "old"
}}

Example 4 (OLD):
Input: "TechCorp brought us more components. They'll deliver 50 units next week."
Output:
{{
    "provider_type": "old"
}}

Rules:
1. Return ONLY the JSON object, no other text
2. Focus on how the provider is introduced/referenced in the text
3. Look for explicit indicators of new partnerships vs ongoing relationships
4. Don't be misled by the amount of detail - focus on context and introduction style
5. Phrases like "brought us more" or references to repeat business always indicate an old provider
Here is my input, please try to find out if it is a new provider or an existing one:
{input}

\n{format_instructions}\n
      `
    ),
    OPENAI_4O,
    parser,
  ]);

  const response = await chain.invoke({
    input: text,
    format_instructions: parser.getFormatInstructions(),
  });

  return response;
};
