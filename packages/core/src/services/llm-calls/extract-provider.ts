import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OPENAI_4O_MINI } from "./_shared";

const schema = z.object({
  name: z.string(),
  category: z.string(),
  phone_number: z.string().optional(),
  email: z.string().optional(),
  identity_card: z.string().optional(),
  description: z.string().optional(),
});

export const extractProvider = async (text: string) => {
  const parser = new StructuredOutputParser(schema);

  const chain = RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(
      `
     You are a specialized information extractor focused on analyzing text to extract provider details. Your task is to return ONLY a JSON object containing the extracted information with no additional text or explanation.

First, determine if the provider is new or existing by checking for these indicators:

NEW Provider indicators:
- Explicit announcements of new partnerships
- Formal introductions
- Phrases like "pleased to introduce", "new partner", "announcing our partnership"

EXISTING Provider indicators:
- Mentioned in context of ongoing operations
- Phrases like "brought us more", "as usual", "regular supplier"
- References to repeat orders or existing relationship

Required Fields (Always Extract):
- name: Provider's company or individual name
- category: Business category derived from their products/services

Additional Fields (Extract ONLY for NEW providers):
- phone_number: Contact phone number if mentioned
- email: Email address if mentioned
- identity_card: Business ID/registration number if mentioned
- description: Comprehensive description of their services

Output Format:
For NEW providers:
{{
    "name": string,
    "category": string,
    "phone_number": string | undefined,
    "email": string | undefined,
    "identity_card": string | undefined,
    "description": string | undefined
}}

For EXISTING providers:
{{
    "name": string,
    "category": string
}}

Examples:

Example 1 (NEW Provider):
Input: "We are excited to introduce Acme Solutions (ID: ACM-2024) as our new electronics supplier. Contact: +1-555-0123, sales@acme.com"
Output:
{{
    "name": "Acme Solutions",
    "category": "electronics",
    "phone_number": "+1-555-0123",
    "email": "sales@acme.com",
    "identity_card": "ACM-2024"
}}

Example 2 (EXISTING Provider):
Input: "Acme Solutions brought us more components for the project. Order includes 50 units of processors."
Output:
{{
    "name": "Acme Solutions",
    "category": "electronics"
}}

Example 3 (EXISTING Provider with Details):
Input: "This is an old provider not a new one TechnoVision Enterprises brought us more .50 TechnoVision NVR-8000 recording units priced at $899. Each unit supports up to 16 cameras, includes 8TB storage, and features AI-powered video analysis."
Output:
{{
    "name": "TechnoVision Enterprises",
    "category": "surveillance_equipment"
}}

Rules:
1. If you see phrases like "brought us more" or mentions of repeat business, treat as EXISTING provider
2. For EXISTING providers, include ONLY name and category
3. Category should be inferred from products/services mentioned
4. Omit any fields that aren't explicitly mentioned in the text
5. Don't be misled by detailed product descriptions - focus on how the provider is introduced
6. Return ONLY the JSON object with no additional text


Here is my input, please extract the provider details:
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
