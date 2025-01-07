import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Events } from "@invoicer/core/user";
import { db } from "@invoicer/database/index";
import { products, providers, teams } from "@invoicer/database/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { Config } from "sst/node/config";
import { EventHandler } from "sst/node/event-bus";
import twilio from "twilio";

// Initialize OpenAI and Twilio clients
const openai = new OpenAI({ apiKey: Config.OPENAI_API_KEY });
const twilioClient = twilio(
  Config.TWILIO_ACCOUNT_SID,
  Config.TWILIO_AUTH_TOKEN
);

export const handler = EventHandler(Events.CallUser, async (event) => {
  const { productId } = event.properties;
  const [data] = await db
    .select()
    .from(products)
    .innerJoin(providers, eq(products.provider_id, providers.id))
    .innerJoin(teams, eq(products.team_id, teams.id))
    .where(eq(products.id, productId));

  if (!data) {
    throw new Error("Product not found");
  }

  const phoneNumber = data.teams.phone_number;
  const productName = data.products.name;
  const providerName = data.providers.name;

  if (!phoneNumber) {
    throw new Error("Phone number not found");
  }

  // Generate speech using OpenAI
  const speechResponse = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: `${productName} from ${providerName} is out of stock. Would you like me to contact them for a resupply?`,
  });

  // Convert the audio response to base64
  const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());

  const bucketName = `public`;
  const audioKey = `audio/${productId}.mp3`;

  // Upload the audio file
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: audioKey,
    Body: audioBuffer,
    ContentType: "audio/mpeg",
    ACL: "public-read", // Make the object publicly readable
  });

  const audioUrl = await getSignedUrl(new S3Client({}), command);

  // Make the call using Twilio
  await twilioClient.calls.create({
    twiml: `<Response><Play>${audioUrl}</Play></Response>`,
    to: phoneNumber,
    from: Config.TWILIO_PHONE_NUMBER,
  });
});
