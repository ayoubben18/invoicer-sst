import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OPENAI_4O_MINI } from "./_shared";

export const determineNewOrOldProvider = async (text: string) => {
  const schema = z.object({
    type: z.enum(["new", "old"]),
  });

  const parser = new StructuredOutputParser(schema);

  const chain = RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(
      `
      You are a specialized text analyzer focused on extracting information about product providers. Your task is to analyze the input text and return ONLY a JSON object with no additional text or explanation.

Rules for classification:
1. If the text contains detailed information about a provider (such as contact details, address, services offered, or multiple descriptive details), classify them as "new"
2. If the text only mentions a provider's name with minimal or no additional details, classify them as "old"

Output Format:
You must return ONLY a JSON object with this exact structure:
{{
    "type": "new" | "old"
}}

Examples:
Explicit (Detailed Information):
Input: "We're excited to announce our partnership with Quantum Dynamics Inc. They specialize in quantum computing hardware, maintain facilities in both California and New York, employ over 200 engineers, and offer comprehensive warranty coverage for all products. Their CEO, Dr. Sarah Chen, has 20 years of industry experience."
Output:
{{
"type": "new"
}}
Implicit (Minimal Information):
Input: "The shipment will be processed through Quantum Dynamics Inc as usual. Please proceed with the order."
Output:
{{
"type": "old"
}}

Remember:
- Return ONLY the JSON object, no other text
- Do not add explanations or notes
- Ensure the JSON is properly formatted
- The only possible values for provider_type are "new" or "old"
- Base the classification solely on the amount of provider details present in the text

Here is my input:
{input}

\n{format_instructions}\n
      `
    ),
    OPENAI_4O_MINI,
    parser,
  ]);

  const response = await chain.invoke({
    input: text,
    format_instructions: parser.getFormatInstructions(),
  });

  return response;
};
