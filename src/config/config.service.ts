import dotenv from 'dotenv';
import fs from 'fs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor(filePath: string) {
    let dotenvConfig;
    if (fs.existsSync(filePath)) {
      dotenvConfig = dotenv.parse(fs.readFileSync(filePath));
    } else {
      console.warn(`Configuration file ${filePath} does not exists. Using default values (not recommended).`);
      dotenvConfig = {};
    }

    this.envConfig = {
      ...process.env,
      ...dotenvConfig,
    };
  }

  get(key: string, defaultValue?: any): string | null {
    const value = this.envConfig[key];
    if (value?.startsWith('file://')) {
      const fileName = value.substring(7);
      if (fs.existsSync(fileName)) {
        return fs.readFileSync(fileName, 'utf8').trim();
      }
    }
    return value !== undefined ? value : defaultValue;
  }

  get hostUrl(): string {
    return this.get('HOST_URL');
  }

  get port(): number {
    return Number(this.get('PORT', 8000));
  }

  get logLevel(): string {
    return this.get('LOG_LEVEL', 'info');
  }

  get databaseUrl(): string {
    return this.get('DATABASE_URL');
  }

  get scienceServerBaseUrl(): string {
    return this.get('SCIENCE_SERVER_BASE_URL');
  }

  get autoRegisterWebhookHandle() {
    return this.get('AUTO_REGISTER_WEBHOOK_HANDLE') === 'true';
  }

  get adminApiKey(): string {
    return this.get('ADMIN_API_KEY');
  }

  get functionArgsParameterLimit(): number {
    return Number(this.get('FUNCTION_ARGS_PARAMETER_LIMIT', 5));
  }
}
