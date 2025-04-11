export interface IEmailProvider {
  send({ from, to, subject, html }: { from: string, to: string, subject: string, html: string }): Promise<void>;
}