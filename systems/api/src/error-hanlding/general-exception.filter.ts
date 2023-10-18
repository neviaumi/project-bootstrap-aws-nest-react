import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import type { ApolloError } from 'apollo-server-errors';
import type { Request, Response } from 'express';
import { omit } from 'ramda';
import { serializeError } from 'serialize-error';

import { AppEnvironment } from '../config/config.constants';
import { ConfigService } from '../config/config.module';
import { err } from '../logging/formats/err';
import { graphql } from '../logging/formats/graphql';
import { http } from '../logging/formats/http';
import { ApolloException } from './apollo.exception';
import { ErrorCode } from './error-code.constant';
import type { ExceptionPayload } from './exception-payload';
import { InternalServerErrorException } from './internal-server-error.exception';

@Catch()
export class GeneralExceptionFilter implements ExceptionFilter {
  private logger = new Logger(GeneralExceptionFilter.name);

  constructor(private config: ConfigService) {}

  catch(exception: Error, host: ArgumentsHost) {
    const isGraphql = host.getType().toString() === 'graphql';

    if (isGraphql) return this.catchGraphqlError(exception, host);
    return this.catchHttpError(exception, host);
  }

  private shouldIncludeStacktraceInErrorResponse() {
    const env = this.config.get('env');
    return [AppEnvironment.DEV, AppEnvironment.TEST].includes(env);
  }

  private catchGraphqlError(
    exception: Error & {
      extensions?: any;
      response?: ExceptionPayload;
    },
    context: ArgumentsHost,
  ) {
    const shouldIncludeStacktraceInErrorResponse =
      this.shouldIncludeStacktraceInErrorResponse();
    const ctx = GqlArgumentsHost.create(context);

    const [error] = exception.response?.errors ?? [];

    const isApolloError = exception.extensions;

    const apolloError: ApolloError = (
      isApolloError
        ? exception
        : new ApolloException({
            code: error?.code ?? ErrorCode.UnhandledError,
            errors: exception.response?.errors ?? [
              {
                detail: exception.message,
                stack: shouldIncludeStacktraceInErrorResponse
                  ? exception.stack
                  : undefined,
                title: exception.name,
              },
            ],
          })
    ) as ApolloError;
    const { req, res } = ctx.getContext<{ req: Request; res: Response }>();
    const end = new Date().getTime();

    const { startAt = end } = res?.locals ?? {};
    this.logger.error(
      {
        duration: end - startAt,
        err: err(apolloError),
        graphql: graphql(ctx),
        http: http(req, Object.assign(res || {}, { body: {} })),
        message: 'Access Log',
      },
      exception.stack,
    );
    return apolloError;
  }

  private catchHttpError(exception: Error, context: ArgumentsHost) {
    const shouldIncludeStacktraceInErrorResponse =
      this.shouldIncludeStacktraceInErrorResponse();
    const ctx = context.switchToHttp();

    const request = ctx.getRequest<Request>();

    const response = ctx.getResponse<Response>();

    const httpException =
      exception instanceof HttpException
        ? exception
        : new InternalServerErrorException({
            code: ErrorCode.UnhandledError,
            errors: [
              {
                detail: exception.message,
                stack: shouldIncludeStacktraceInErrorResponse
                  ? exception.stack
                  : undefined,
                title: exception.name,
              },
            ],
            meta: { exception: omit(['stack'])(serializeError(exception)) },
          });
    httpException.stack = exception.stack as string;

    const { body, status } = {
      body: httpException.getResponse(),
      status: httpException.getStatus(),
    };
    const { startAt } = response.locals;
    const end = new Date().getTime();
    // accessLog repeated here Because NestJS interceptor can't capture error throw from guard
    // https://stackoverflow.com/questions/61087776/interceptor-not-catching-error-thrown-by-guard-in-nestjs
    // https://docs.nestjs.com/faq/request-lifecycle
    response.status(status).json(body);

    this.logger.error(
      {
        duration: end - startAt,
        err: err(httpException),
        http: http(request, Object.assign(response, { body })),
        message: 'Access Log',
      },
      exception.stack,
    );
  }
}
