import { Emitter } from '@socket.io/redis-emitter';
import { getFnMock, TypedMock } from '../utils/test-utils';

export default {
  to: getFnMock<Emitter['to']>().mockImplementation(function () {
    return this;
  }),
  emit: getFnMock<Emitter['emit']>(),
} as TypedMock<Emitter>;
