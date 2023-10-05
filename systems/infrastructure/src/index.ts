import * as pulumi from '@pulumi/pulumi';

import { createAPIGateWay } from './aws/api-gateway.ts';
import { createCloudFront } from './aws/cloudfront.ts';
import { createDynamoDb } from './aws/dynamodb.ts';
import { createECRImage } from './aws/ecr/index.ts';
import { createLambda } from './aws/lambda.ts';
import {
  createS3AssetsBucket,
  createS3WebHostingBucket,
  uploadTestIndexFile,
} from './aws/s3/index.ts';

const { table } = createDynamoDb();
const { bucket: webBucket } = createS3WebHostingBucket();
const { bucket: assetsBucket } = createS3AssetsBucket();
const { domainName: frontendDomain } = createCloudFront(webBucket);
const { image } = createECRImage();
const { lambdaFunction, lambdaLatestVersionAlias } = createLambda(
  image.imageUri,
  {
    frontendDomain,
    s3Bucket: webBucket,
  },
);
const { apigw } = createAPIGateWay({
  frontendDomain,
  lambda: {
    invokeArn: lambdaFunction.invokeArn,
    name: lambdaFunction.name,
  },
});
await uploadTestIndexFile(webBucket, apigw);
export const DYNAMODB_GAME_TABLE_NAME = table.name;
export const ASSETS_S3_BUCKET = assetsBucket.bucket;
export const WEB_S3_BUCKET = webBucket.bucket;
export const WEB_HOST = pulumi.interpolate`https://${frontendDomain}`;
export const API_HOST = apigw.apiEndpoint;
export const API_DOCKER_IMAGE = image.imageUri.apply(uri => uri.split(':')[0]);
export const API_LAMBDA_FUNCTION_ARN = lambdaFunction.arn;
export const API_LAMBDA_FUNCTION_LATEST_VERSION_ALIAS_ARN =
  lambdaLatestVersionAlias.name;
