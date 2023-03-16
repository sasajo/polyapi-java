export interface TeachResponseDto {
  functionId: number;
  variables?: {
    [key: string]: string;
  };
}
