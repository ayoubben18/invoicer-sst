import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OPENAI_4O, OPENAI_4O_MINI } from "./_shared";

const schema = z.object({
  products: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().positive(),
      price: z.number().optional(),
      description: z.string(),
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

name: Product name/model
description: Product specifications and features
quantity: Numerical quantity (default to 1 if not specified)
price: Integer price of the product (0 if not mentioned)

Output Format:
Return ONLY a JSON object following this structure:
{{
"name": string,
"description": string,
"quantity": number,    // Always included, minimum 1
"price": number       // Always included as integer, 0 if not specified
}}
Examples:
Example 1 (Explicit Quantity and Price):
Input: "We need 50 units of Intel i7-12700K processors at $389.99 each. These are 12th generation CPUs with 12 cores, 20 threads, and up to 5.0 GHz clock speed."
Output:
{{
"name": "Intel i7-12700K",
"description": "12th generation CPU with 12 cores, 20 threads, and up to 5.0 GHz clock speed",
"quantity": 50,
"price": 390
}}
Example 2 (No Quantity Specified):
Input: "The Samsung 970 EVO Plus is an NVMe SSD priced at €179.99, with read speeds up to 3,500MB/s and write speeds up to 3,300MB/s, featuring Samsung's V-NAND technology."
Output:
{{
"name": "Samsung 970 EVO Plus",
"description": "NVMe SSD with read speeds up to 3,500MB/s and write speeds up to 3,300MB/s, featuring Samsung's V-NAND technology",
"quantity": 1,
"price": 180
}}
Example 3 (Multiple Products):
Input: "Order details: 25 Logitech MX Master 3 wireless mice at $99.99 each with advanced 4000 DPI tracking, and Corsair K95 RGB Platinum keyboard with Cherry MX switches and dedicated macro keys."
Output:
[
{{
"name": "Logitech MX Master 3",
"description": "wireless mouse with advanced 4000 DPI tracking",
"quantity": 25,
"price": 100
}},
{{
"name": "Corsair K95 RGB Platinum",
"description": "keyboard with Cherry MX switches and dedicated macro keys",
"quantity": 1,
"price": 0
}}
]
Example 4 (No Price):
Input: "200 meters of TechnoGuard Premium Security Cable with advanced signal protection and weather-resistant coating."
Output:
{{
"name": "TechnoGuard Premium Security Cable",
"description": "Advanced signal protection and weather-resistant coating",
"quantity": 200,
"price": 0
}}
Rules:

Return ONLY the JSON object/array, no other text
If multiple products are mentioned, return an array of product objects
ALWAYS include quantity field:

Use the specified quantity if mentioned
Default to 1 if no quantity is specified


ALWAYS include price field:

Round to nearest integer
Use 0 if no price is mentioned


Keep descriptions concise but include all relevant technical specifications
Use proper JSON formatting
For product names, include both brand and model when available
Description should focus on technical specifications and key features

Here is my input, please extract the products:
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

  return response.products;
};
