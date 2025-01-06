import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OPENAI_4O_MINI } from "./_shared";

const schema = z.object({
  name: z.string(),
  category: z.string(),
  // phone_number: z.string().optional(),
  // email: z.string().optional(),
  // identity_card: z.string().optional(),
  description: z.string().optional(),
});

export const extractProvider = async (text: string) => {
  const parser = new StructuredOutputParser(schema);

  const chain = RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(
      `
     You are a specialized information extractor focused on analyzing text to extract provider details. Your task is to return ONLY a JSON object containing the extracted information with no additional text or explanation.

Required Fields (Always Extract):
- name: Provider's company or individual name
- category: Business category derived from their products/services (e.g., "electronics", "software", "hardware", "consulting")

Conditional Fields (Extract Only for New Providers):
If the text contains detailed information suggesting this is a new provider, also extract:
- phone_number: Contact phone number if mentioned
- identity_card: Any form of business ID/registration number if mentioned
- description: Comprehensive description of their services and capabilities

Output Format:
Return ONLY a JSON object following this structure:
{{
    "name": string,
    "category": string,
    "phone_number": string | undefined,
    "email": string | undefined,
    "identity_card": string | undefined,
    "description": string | undefined
}}

Note: For existing providers (minimal details), set conditional fields to null.

Examples:

Example 1 (New Provider):
Input: "We're partnering with MicroTech Solutions (ID: BRN-789456) for our semiconductor needs. They specialize in custom microprocessor manufacturing with state-of-the-art facilities in Taiwan. Contact them at +1-555-0123 or support@microtech.com for orders. Their automated production line handles 5000 units daily with 99.9% accuracy."
Output:
{{
    "name": "MicroTech Solutions",
    "category": "semiconductors",
    "phone_number": "+1-555-0123",
    "email": "support@microtech.com",
    "identity_card": "BRN-789456",
    "description": "Specializes in custom microprocessor manufacturing with state-of-the-art facilities in Taiwan. Automated production line handles 5000 units daily with 99.9% accuracy."
}}

Example 2 (Existing Provider):
Input: "Send the order to DataCore Systems for the new server components."
Output:
{{
    "name": "DataCore Systems",
    "category": "hardware"
}}

Example 3 (New Provider with Partial Information):
Input: "Our new cloud services provider CloudMatrix (License #CLM2024) offers enterprise-level hosting solutions with 24/7 support. Their infrastructure includes redundant data centers across three continents. For inquiries, email: info@cloudmatrix.io"
Output:
{{
    "name": "CloudMatrix",
    "category": "cloud_services",
    "email": "info@cloudmatrix.io",
    "identity_card": "CLM2024",
    "description": "Offers enterprise-level hosting solutions with 24/7 support. Infrastructure includes redundant data centers across three continents."
}}

Rules:
1. Return ONLY the JSON object, no other text
2. Always include all fields in the output
3. Omit fields entirely when information is not available (they will be undefined)
4. Infer the category from products/services mentioned
5. For description, combine all relevant details about capabilities, services, and distinguishing features
6. Extract phone numbers and identity cards exactly as they appear in the text
7. If multiple phone numbers exist, use the primary/first mentioned one
8. Maintain proper JSON formatting

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
