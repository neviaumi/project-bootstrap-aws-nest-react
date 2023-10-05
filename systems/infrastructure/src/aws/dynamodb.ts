import * as aws from '@pulumi/aws';

import { resourceName } from '../utils/resourceName.ts';

export function createDynamoDb() {
  const table = new aws.dynamodb.Table(resourceName`game`, {
    attributes: [
      {
        name: 'UserId',
        type: 'S',
      },
      {
        name: 'Platform',
        type: 'S',
      },
    ],
    billingMode: 'PAY_PER_REQUEST',
    hashKey: 'UserId',
    rangeKey: 'Platform',
  });
  return { table };
}
