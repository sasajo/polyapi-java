import { CommonService } from 'common/common.service';
import { getFnMock, TypedMock } from '../utils/test-utils';

export default {
  sanitizeNameIdentifier: getFnMock<CommonService['sanitizeNameIdentifier']>().mockImplementation((name: string) => name),
  sanitizeContextIdentifier: getFnMock<CommonService['sanitizeContextIdentifier']>().mockImplementation((context: string) => context),
  resolveType: getFnMock<CommonService['resolveType']>(),
  toPropertyType: getFnMock<CommonService['toPropertyType']>(),
} as TypedMock<CommonService>;
