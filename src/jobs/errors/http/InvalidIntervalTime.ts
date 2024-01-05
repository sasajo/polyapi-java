import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidIntervalTimeException extends HttpException {
  constructor(minimumExecutionInterval: number) {
    super(`You cannot configure an interval time lower than ${minimumExecutionInterval} minutes`, HttpStatus.BAD_REQUEST);
  }
}
