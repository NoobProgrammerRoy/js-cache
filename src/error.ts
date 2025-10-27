export class RespError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RespError';
  }
}
