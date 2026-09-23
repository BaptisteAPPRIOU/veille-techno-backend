import {
  ArgumentsHost,
  Catch,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../generated/prisma/client';

/**
 * Map known Prisma errors to standard Nest HTTP responses
 * (`{ statusCode, message, error }`) for predictable failures.
 * - P2002 (unique constraint, e.g. an email already in use) → 409 Conflict
 * - P2025 (record not found) → 404 Not Found
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    super.catch(this.toHttpException(exception), host);
  }

  private toHttpException(exception: Prisma.PrismaClientKnownRequestError): HttpException {
    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target;
        const fields = Array.isArray(target) ? target.join(', ') : typeof target === 'string' ? target : '';
        return new ConflictException(
          fields ? `Value already in use for: ${fields}` : 'Conflict: this value is already in use',
        );
      }
      case 'P2025':
        return new NotFoundException('Resource not found');
      default:
        this.logger.error(`Unhandled Prisma error (${exception.code}): ${exception.message}`);
        return new InternalServerErrorException();
    }
  }
}
