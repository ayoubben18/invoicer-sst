import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { addProductsProcessSchema } from "../../core/src/schemas";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { teamId, prompt } = addProductsProcessSchema.parse(body);

  // Auth using redis

  const client = new SFNClient({}); //Create the Step Function client

  // Send a command to this client to start the state machine which ARN is specified
  await client.send(
    new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE,
      input: JSON.stringify({
        teamId,
        prompt,
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
