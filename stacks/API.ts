import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import {
  Api,
  Config,
  Function as SSTFunction,
  StackContext,
  use,
} from "sst/constructs";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Bus } from "./BUS";

export function API({ stack }: StackContext) {
  const EVENT_BUS = new Config.Secret(stack, "EVENT_BUS");
  const determineProviderState = new SSTFunction(
    stack,
    "DetermineProviderState",
    {
      handler:
        "packages/functions/src/provider/identify-new-or-old-provider.handler",
    }
  );

  // Add new Lambda functions
  const handleNewProvider = new SSTFunction(stack, "HandleNewProvider", {
    handler: "packages/functions/src/provider/handle-new-provider.handler",
  });

  const handleExistingProvider = new SSTFunction(
    stack,
    "HandleExistingProvider",
    {
      handler:
        "packages/functions/src/provider/handle-existing-provider.handler",
      bind: [EVENT_BUS],
    }
  );

  // Add with other Lambda function definitions
  const generateAndSendInvoice = new SSTFunction(
    stack,
    "GenerateAndSendInvoice",
    {
      handler:
        "packages/functions/src/product/generate-and-send-invoice.handler",
    }
  );

  // Create the state machine with choice
  const stateMachine = new sfn.StateMachine(stack, "ProviderWorkflow", {
    definitionBody: sfn.DefinitionBody.fromChainable(
      sfn.Chain.start(
        new LambdaInvoke(stack, "DetermineProviderState-Invoke", {
          lambdaFunction: determineProviderState,
          outputPath: "$.Payload",
        }).next(
          new sfn.Choice(stack, "ProviderTypeChoice")
            .when(
              sfn.Condition.stringEquals("$.type", "new"),
              new LambdaInvoke(stack, "HandleNewProvider-Invoke", {
                lambdaFunction: handleNewProvider,
              }).next(
                new LambdaInvoke(stack, "GenerateAndSendInvoice-Invoke-new", {
                  lambdaFunction: generateAndSendInvoice,
                })
              )
            )
            .when(
              sfn.Condition.stringEquals("$.type", "old"),
              new LambdaInvoke(stack, "HandleExistingProvider-Invoke-old", {
                lambdaFunction: handleExistingProvider,
              }).next(
                new LambdaInvoke(stack, "GenerateAndSendInvoice-Invoke", {
                  lambdaFunction: generateAndSendInvoice,
                })
              )
            )
            .otherwise(
              new sfn.Fail(stack, "InvalidProviderType", {
                cause: "Invalid provider type",
                error: "ProviderTypeError",
              })
            )
        )
      )
    ),
  });
  const bus = use(Bus);
  const api = new Api(stack, "api", {
    defaults: {
      function: {
        permissions: [bus, "events:PutEvents"],
        environment: {
          EVENT_BUS: bus.eventBusName,
        },
      },
    },
    routes: {
      "POST /add-products-process": {
        function: {
          handler: "packages/functions/src/add-products-process.handler",
          environment: {
            STATE_MACHINE: stateMachine.stateMachineArn,
          },
        },
      },
    },
  });

  api.attachPermissionsToRoute("POST /add-products-process", [
    [stateMachine, "grantStartExecution"],
  ]);

  stack.addOutputs({
    ApiEndpoint: api.url,
    StateMachineArn: stateMachine.stateMachineArn,
  });
}
