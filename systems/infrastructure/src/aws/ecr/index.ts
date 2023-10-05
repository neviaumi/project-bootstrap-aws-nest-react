import path from 'node:path';

// eslint-disable-next-line n/no-extraneous-import
import * as awsx from '@pulumi/awsx';

import { isRunningOnLocal } from '../../utils/isRunningOnLocal.ts';
import { resourceName } from '../../utils/resourceName.ts';
import { valueNa } from '../../utils/value-na.ts';

const currentDir = path.parse(new URL(import.meta.url).pathname).dir;

export function createECRImage() {
  if (isRunningOnLocal()) {
    return {
      image: { imageUri: valueNa },
    };
  }
  const repository = new awsx.ecr.Repository(resourceName`repository`, {
    forceDelete: true,
  });
  const image = new awsx.ecr.Image(resourceName`lambda-image`, {
    extraOptions: ['--quiet'],
    path: path.join(currentDir),
    repositoryUrl: repository.url,
  });
  return { image: { imageUri: image.imageUri } };
}
