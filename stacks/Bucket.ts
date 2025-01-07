import { BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { StackContext, Bucket } from "sst/constructs";

export function BUCKET(ctx: StackContext) {
  const bucket = new Bucket(ctx.stack, "public", {
    cdk: {
      bucket: {
        publicReadAccess: true,
        blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      },
    },
  });
  return bucket;
}
