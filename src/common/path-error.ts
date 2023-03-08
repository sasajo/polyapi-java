export class PathError extends Error {
  constructor(path: string) {
    super(`Invalid path ${path}`);
  }
}
