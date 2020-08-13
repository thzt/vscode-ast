import { OutputChannel } from "vscode";
import { logPrefix, errorPrefix } from "./constant";

const decorateChannel = (channel: OutputChannel) => {
  return {
    log: (message: string) => channel.appendLine(`${logPrefix}${message}`),
    error: (message: string) => {
      channel.appendLine(`${errorPrefix}${message}`);
      throw new Error(message);
    },
    outputNewline: () => {
      channel.appendLine('');
    },
  };
};

export default decorateChannel;
