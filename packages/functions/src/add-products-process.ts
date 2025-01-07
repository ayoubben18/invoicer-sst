import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { addProductsProcessSchema } from "../../core/src/schemas";
import { redis } from "@invoicer/database/index";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { teamId, prompt, processId } = addProductsProcessSchema.parse(body);

  const authToken = event.headers.authorization;

  if (!authToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized",
      }),
    };
  }

  const authKey = `process-${processId}`;
  const redisToken = await redis.get(authKey);

  console.log("redisToken", redisToken, authKey);

  if (redisToken !== authToken) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Forbidden",
      }),
    };
  }

  console.log("Starting state machine");

  // Auth using redis

  const client = new SFNClient({}); //Create the Step Function client

  // Send a command to this client to start the state machine which ARN is specified
  await client.send(
    new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE,
      input: JSON.stringify({
        teamId,
        prompt,
        processId,
      }),
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Start machine started",
    }),
  };
};
