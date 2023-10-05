import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { isRunningOnLocal } from '../utils/isRunningOnLocal.ts';
import { resourceName } from '../utils/resourceName.ts';
import { valueNa } from '../utils/value-na.ts';

export function createAPIGateWay({
  frontendDomain,
  lambda,
}: {
  frontendDomain: pulumi.Output<string>;
  lambda: {
    invokeArn: pulumi.Output<string>;
    name: pulumi.Output<string>;
  };
}) {
  if (isRunningOnLocal()) {
    return { apigw: { apiEndpoint: valueNa } };
  }
  new aws.lambda.Permission(
    resourceName`permission-for-connect-api-gateway-to-lambda`,
    {
      action: 'lambda:InvokeFunction',
      function: lambda.name,
      principal: 'apigateway.amazonaws.com',
    },
  );

  // Set up the API Gateway
  const apigw = new aws.apigatewayv2.Api(resourceName`ApiGateway`, {
    corsConfiguration: {
      allowCredentials: true,
      allowHeaders: ['Content-Type'],
      allowMethods: ['*'],
      allowOrigins: [pulumi.interpolate`https://${frontendDomain}`],
    },
    protocolType: 'HTTP',
    routeKey: '$default',
    target: lambda.invokeArn,
  });
  return { apigw };
}
