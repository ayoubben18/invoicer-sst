import { EventBus, StackContext, Config } from "sst/constructs";
export function Bus(ctx: StackContext) {
  const bus = new EventBus(ctx.stack, "InvoicerBus", {});

  bus.subscribe("product.extracted", {
    handler: "packages/functions/src/product/handle-insert-product.handler",
  });

  return bus;
}
