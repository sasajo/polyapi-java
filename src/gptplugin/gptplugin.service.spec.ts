import { HttpService } from '@nestjs/axios';
import { ApiSpecService } from './gptplugin.service';


describe('ApiSpecService', () => {
  let service: ApiSpecService;
  const httpService = new HttpService();

  beforeEach(() => {
    service = new ApiSpecService(httpService);
  });

  describe('getOpenApiSpec', () => {
    it('should return true', async () => {
      expect(await service.getOpenApiSpec("foobar")).toBeTruthy();
    });
  });

  describe('getOpenApiUrl', () => {
    it('', async () => {
      const url = service.getOpenApiUrl("develop", "https://develop.polyapi.io")
      expect(url).toBe("https://develop.polyapi.io/openapi-develop.yaml");
    });
  });
});
