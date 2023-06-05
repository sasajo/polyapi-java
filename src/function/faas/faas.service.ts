export interface FaasService {
  init: () => Promise<void>;
  createFunction: (id: string, name: string, code: string, requirements: string[], apiKey: string) => Promise<void>;
  executeFunction: (id: string, args: any[]) => Promise<any>;
  updateFunction: (id: string, requirements: string[], apiKey: string) => Promise<void>;
}
