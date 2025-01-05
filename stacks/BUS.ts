import { StackContext, Queue, EventBus } from "sst/constructs";

export function Bus(ctx: StackContext) {
  const bus = new EventBus(ctx.stack, "TalentinoEventBus", {});

  // Create separate queues for each event type
  const processResumeQueue = new Queue(ctx.stack, "ProcessResumeQueue", {
    consumer: {
      function: {
        handler:
          "packages/functions/src/credits-consumption/process-resume.handler",
      },
    },
  });

  const processJobRequirementsQueue = new Queue(
    ctx.stack,
    "ProcessJobRequirementsQueue",
    {
      consumer: {
        function: {
          handler:
            "packages/functions/src/credits-consumption/process-job-requirements.handler",
        },
      },
    }
  );

  const scoreResumeQueue = new Queue(ctx.stack, "ScoreResumeQueue", {
    consumer: {
      function: {
        handler:
          "packages/functions/src/credits-consumption/score-resume.handler",
      },
    },
  });

  const creditResetQueue = new Queue(ctx.stack, "CreditResetQueue", {
    consumer: {
      function: {
        handler: "packages/functions/src/credits-reset/reset-credits.handler",
      },
    },
  });

  const startProcessingQueue = new Queue(ctx.stack, "StartProcessingQueue", {
    consumer: {
      function: {
        handler: "packages/functions/src/start-processing.handler",
      },
    },
  });

  // Add rules for each event type
  bus.addRules(ctx.stack, {
    processResume: {
      pattern: {
        detailType: ["process_resume"],
      },
      targets: {
        queue: processResumeQueue,
      },
    },
    processJobRequirements: {
      pattern: {
        detailType: ["process_job_requirements"],
      },
      targets: {
        queue: processJobRequirementsQueue,
      },
    },
    scoreResume: {
      pattern: {
        detailType: ["score_resume"],
      },
      targets: {
        queue: scoreResumeQueue,
      },
    },
    resetCredits: {
      pattern: {
        detailType: ["reset_credits"],
      },
      targets: {
        queue: creditResetQueue,
      },
    },
    startProcessing: {
      pattern: {
        detailType: ["start_processing"],
      },
      targets: {
        queue: startProcessingQueue,
      },
    },
  });

  return bus;
}
