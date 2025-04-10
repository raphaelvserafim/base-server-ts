export interface IEmailProvider {
  send(
    from: string,
    to: string,
    subject: string,
    html: string): Promise<void>;
}