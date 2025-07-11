export interface ISMSProvider {
  send({ from, to, text }: { from: string, to: string, text: string }): Promise<void>;
}