import {
  StackContext,
  Api,
  EventBus,
  Function as SSTFunction,
} from "sst/constructs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";

export function API({ stack }: StackContext) {
  // Create Lambda functions for each step
  const identifyProviderFn = new SSTFunction(stack, "IdentifyProvider", {
    handler:
      "packages/functions/src/provider/identify-new-or-old-provider.handler",
  });

  // Define the Step Functions workflow
  const identifyProvider = new tasks.LambdaInvoke(
    stack,
    "IdentifyNewOrOldProvider",
    {
      lambdaFunction: identifyProviderFn,
    }
  );

  // Define parallel paths for new provider
  const newProviderBranch = sfn.Chain.start(
    new tasks.LambdaInvoke(stack, "GetProviderInfos", {
      lambdaFunction: new SSTFunction(stack, "GetProviderInfosFn", {
        handler: "packages/functions/src/provider/get-provider-infos.handler",
      }),
    })
  )
    .next(
      new tasks.LambdaInvoke(stack, "FindProducts", {
        lambdaFunction: new SSTFunction(stack, "FindProductsFn", {
          handler: "packages/functions/src/provider/find-products.handler",
        }),
      })
    )
    .next(
      new tasks.LambdaInvoke(stack, "InsertInDatabase", {
        lambdaFunction: new SSTFunction(stack, "InsertInDatabaseFn", {
          handler: "packages/functions/src/provider/insert-in-database.handler",
        }),
      })
    )
    .next(
      new tasks.LambdaInvoke(stack, "GenerateEmbeddingAndInsert", {
        lambdaFunction: new SSTFunction(stack, "GenerateEmbeddingAndInsertFn", {
          handler:
            "packages/functions/src/provider/generate-embedding-and-insert.handler",
        }),
      })
    );

  // Define parallel paths for existing provider
  const oldProviderBranch = sfn.Chain.start(
    new sfn.Parallel(stack, "OldProviderTasks").branch(
      sfn.Chain.start(
        new tasks.LambdaInvoke(stack, "FindProviderUsingEmbedding", {
          lambdaFunction: new SSTFunction(
            stack,
            "FindProviderUsingEmbeddingFn",
            {
              handler:
                "packages/functions/src/provider/find-provider-using-embedding.handler",
            }
          ),
        })
      ),
      sfn.Chain.start(
        new tasks.LambdaInvoke(stack, "IdentifyProducts", {
          lambdaFunction: new SSTFunction(stack, "IdentifyProductsFn", {
            handler:
              "packages/functions/src/provider/identify-products.handler",
          }),
        })
      )
    )
  )
    .next(
      new tasks.LambdaInvoke(stack, "GenerateEmbeddingForProduct", {
        lambdaFunction: new SSTFunction(
          stack,
          "GenerateEmbeddingForProductFn",
          {
            handler:
              "packages/functions/src/provider/generate-embedding-for-product.handler",
          }
        ),
      })
    )
    .next(
      new tasks.LambdaInvoke(stack, "SearchForProduct", {
        lambdaFunction: new SSTFunction(stack, "SearchForProductFn", {
          handler: "packages/functions/src/provider/search-for-product.handler",
        }),
      })
    )
    .next(
      new tasks.LambdaInvoke(stack, "UpdateOrInsert", {
        lambdaFunction: new SSTFunction(stack, "UpdateOrInsertFn", {
          handler: "packages/functions/src/provider/update-or-insert.handler",
        }),
      })
    );

  // Create choice state
  const providerChoice = new sfn.Choice(stack, "NewOrExistingProvider")
    .when(sfn.Condition.stringEquals("$.type", "new"), newProviderBranch)
    .otherwise(oldProviderBranch);

  // Final step
  const generateInvoice = new tasks.LambdaInvoke(
    stack,
    "GenerateInvoiceAndMail",
    {
      lambdaFunction: new SSTFunction(stack, "GenerateInvoiceAndMailFn", {
        handler:
          "packages/functions/src/provider/generate-invoice-and-mail.handler",
      }),
    }
  );

  // Create the state machine
  const stateMachine = new sfn.StateMachine(stack, "ProviderWorkflow", {
    definition: sfn.Chain.start(identifyProvider)
      .next(providerChoice)
      .next(generateInvoice),
  });

  const api = new Api(stack, "api", {
    defaults: {
      function: {},
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
