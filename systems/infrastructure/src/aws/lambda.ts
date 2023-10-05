import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { isRunningOnLocal } from '../utils/isRunningOnLocal.ts';
import { resourceName } from '../utils/resourceName.ts';
import { valueNa } from '../utils/value-na.ts';

export function createLambda(
  imageUri: pulumi.Output<string>,
  {
    frontendDomain,
    s3Bucket,
  }: {
    frontendDomain: pulumi.Output<string>;
    s3Bucket: aws.s3.BucketV2;
  },
) {
  if (isRunningOnLocal()) {
    return {
      lambdaFunction: { arn: valueNa, invokeArn: valueNa, name: valueNa },
      lambdaLatestVersionAlias: { name: valueNa },
    };
  }
  const role = new aws.iam.Role(resourceName`role-lambda`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: 'lambda.amazonaws.com',
    }),
  });
  new aws.iam.RolePolicyAttachment(resourceName`role-policy-lambda`, {
    policyArn: aws.iam.ManagedPolicy.AWSLambdaExecute,
    role: role,
  });
  new aws.iam.RolePolicyAttachment(resourceName`role-policy-dynamodb`, {
    policyArn: aws.iam.ManagedPolicy.AmazonDynamoDBReadOnlyAccess,
    role: role,
  });

  const lambdaFunction = new aws.lambda.Function(resourceName`lambda`, {
    environment: {
      variables: {
        APP_ENV: 'production',
        APP_MODE: 'lambda',
        CLOUDFRONT_URL: pulumi.interpolate`https://${frontendDomain}`,
        NODE_ENV: 'production',
        S3_ASSET_BUCKET: s3Bucket.bucket,
        S3_REGION: 'eu-west-2',
      },
    },
    imageConfig: {
      commands: ['main-lambda.handler'],
    },
    imageUri,
    packageType: 'Image',
    publish: true,
    role: role.arn,
    timeout: 60,
  });
  const lambdaLatestVersionAlias = new aws.lambda.Alias(
    `lambda-version-alias`,
    {
      functionName: lambdaFunction.arn,
      functionVersion: '1',
    },
  );
  new aws.lambda.ProvisionedConcurrencyConfig(`lambda-provision-config`, {
    functionName: lambdaLatestVersionAlias.functionName,
    provisionedConcurrentExecutions: 1,
    qualifier: lambdaLatestVersionAlias.name,
  });
  return { lambdaFunction, lambdaLatestVersionAlias };
}
