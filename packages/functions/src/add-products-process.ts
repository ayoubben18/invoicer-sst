import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { z } from "zod";

const schema = z.object({
  teamId: z.number(),
  prompt: z.string(),
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { teamId, prompt } = schema.parse(body);

  const client = new SFNClient({}); //Create the Step Function client

  // Send a command to this client to start the state machine which ARN is specified
  await client.send(
    new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE,
    })
  );

  return {
    statusCode: 200,
    body: "Start machine started",
  };
};
