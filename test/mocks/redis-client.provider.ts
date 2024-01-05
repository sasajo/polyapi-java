import { Redis } from 'ioredis';
import { TypedMock, getFnMock } from '../utils/test-utils';

export default {
  on: getFnMock<Redis['on']>(),
  lpush: getFnMock<Redis['lpush']>(),
  lrange: getFnMock<Redis['lrange']>(),
  lrem: getFnMock<Redis['lrem']>(),
} as TypedMock<Redis>;
