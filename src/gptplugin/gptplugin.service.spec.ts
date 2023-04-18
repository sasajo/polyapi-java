import { HttpService } from '@nestjs/axios';
import { GptPluginService } from './gptplugin.service';


describe('GptPluginService', () => {
  let service: GptPluginService;
  const httpService = new HttpService();

  beforeEach(() => {
    service = new GptPluginService(httpService);
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
