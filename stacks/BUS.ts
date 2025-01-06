import { StackContext, Queue, EventBus } from "sst/constructs";

export function Bus(ctx: StackContext) {
  const bus = new EventBus(ctx.stack, "InvoicerBus", {});

  const handleInsertProducts = new Queue(
    ctx.stack,
    "HandleInsertProductsQueue",
    {
      consumer: {
        function: {
          handler:
            "packages/functions/src/product/handle-insert-product.handler",
        },
      },
    }
  );

  bus.addRules(ctx.stack, {
    handleInsertProducts: {
      pattern: {
        detailType: ["handleInsertProducts"],
      },
      targets: {
        queue: handleInsertProducts,
      },
    },
  });

  return bus;
}
