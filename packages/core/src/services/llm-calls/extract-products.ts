import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OPENAI_4O_MINI } from "./_shared";

const schema = z.object({
  products: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().optional(),
      price: z.number().optional(),
      description: z.string().optional(),
    })
  ),
});

export const extractProducts = async (text: string) => {
  const parser = new StructuredOutputParser(schema);

  const chain = RunnableSequence.from([
    ChatPromptTemplate.fromTemplate(
      `
   You are a specialized product information extractor. Your task is to analyze text and return ONLY a JSON object containing product details with no additional text or explanation.

Fields to Extract:
- name: Product name/model
- description: Product specifications and features
- quantity: Numerical quantity mentioned (if no quantity is mentioned, omit this field)
- price: Price of the product (if mentioned, include currency when available)

Output Format:
Return ONLY a JSON object following this structure:
{{
    "name": string,
    "description": string,
    "quantity": number | undefined,
    "price": number | undefined
}}

Examples:

Example 1 (With Quantity and Price):
Input: "We need 50 units of Intel i7-12700K processors at $389 each. These are 12th generation CPUs with 12 cores, 20 threads, and up to 5.0 GHz clock speed."
Output:
{{
    "name": "Intel i7-12700K",
    "description": "12th generation CPU with 12 cores, 20 threads, and up to 5.0 GHz clock speed",
    "quantity": 50,
    "price": 389
}}

Example 2 (With Price, No Quantity):
Input: "The Samsung 970 EVO Plus is an NVMe SSD priced at €179.99, with read speeds up to 3,500MB/s and write speeds up to 3,300MB/s, featuring Samsung's V-NAND technology."
Output:
{{
    "name": "Samsung 970 EVO Plus",
    "description": "NVMe SSD with read speeds up to 3,500MB/s and write speeds up to 3,300MB/s, featuring Samsung's V-NAND technology",
    "price": 179.99
}}

Example 3 (Multiple Products with Mixed Information):
Input: "Order details: 25 Logitech MX Master 3 wireless mice at $99.99 each with advanced 4000 DPI tracking, and 30 Corsair K95 RGB Platinum keyboards with Cherry MX switches and dedicated macro keys."
Output:
[
    {{
        "name": "Logitech MX Master 3",
        "description": "wireless mouse with advanced 4000 DPI tracking",
        "quantity": 25,
        "price": 99.99
    }},
    {{
        "name": "Corsair K95 RGB Platinum",
        "description": "keyboard with Cherry MX switches and dedicated macro keys",
        "quantity": 30
    }}
]

Rules:
1. Return ONLY the JSON object/array, no other text
2. If multiple products are mentioned, return an array of product objects
3. Extract exact quantities when mentioned
4. Omit the quantity field if no specific number is mentioned
5. Keep descriptions concise but include all relevant technical specifications
6. Use proper JSON formatting
7. For product names, include both brand and model when available
8. Description should focus on technical specifications and key features
9. Extract prices as numbers only (remove currency symbols)
10. Handle different currency formats (USD, EUR, GBP, etc.)
11. For prices with decimals, maintain the decimal precision as shown in the text

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

  return response.products;
};
