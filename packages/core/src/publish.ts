import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { SQSEvent } from "aws-lambda";

export interface Events {
  handleInsertProducts: {
    teamId: string;
    productsInfos: any[];
    providerId: string;
  };
}

export async function publish<T extends keyof Events>(
  event: T,
  data: Events[T]
): Promise<void> {
  const client = new EventBridgeClient({});

  console.log("InvoicerBus");

  const res = await client.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: "InvoicerBus",
          Source: event,
          DetailType: event,
          Detail: JSON.stringify(data),
        },
      ],
    })
  );
  console.log(res);
  console.log("Event published");
}

export async function createHandler<T extends keyof Events>(
  _event: T,
  handler: (event: T, props: Events[T]) => Promise<void>
) {
  const result = async (event: SQSEvent) => {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      const detail = body.detail;
      try {
        await handler(_event, detail);
      } catch (error) {
        // TODO : log this to sentry
        console.error(error);
      }
    }
  };

  return result;
}
