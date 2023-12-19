import { TypedMock, getFnMock } from '../utils/test-utils';
import Redlock from 'redlock';
import redisClientMock from './redis-client.provider';

export default {
  clients: new Set([redisClientMock]),
  acquire: getFnMock<Redlock['acquire']>(),
} as TypedMock<Redlock>;
