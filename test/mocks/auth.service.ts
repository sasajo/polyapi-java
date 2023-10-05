import { getFnMock, TypedMock } from '../utils/test-utils';
import { AuthService } from 'auth/auth.service';

export default {
  checkEnvironmentEntityAccess: getFnMock<AuthService['checkEnvironmentEntityAccess']>(),
  hasEnvironmentEntityAccess: getFnMock<AuthService['hasEnvironmentEntityAccess']>(),
  hashApiKey: getFnMock<AuthService['hashApiKey']>(),
} as TypedMock<AuthService>;
