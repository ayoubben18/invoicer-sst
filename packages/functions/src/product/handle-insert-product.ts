import { EventHandler } from "sst/node/event-bus";
import { Events } from "@invoicer/core/src/products";

export const handler = EventHandler(Events.Extracted, async (event) => {
  console.log(event);
});
