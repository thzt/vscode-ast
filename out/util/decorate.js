"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("./constant");
const decorateChannel = (channel) => {
    return {
        log: (message) => channel.appendLine(`${constant_1.logPrefix}${message}`),
        error: (message) => {
            channel.appendLine(`${constant_1.errorPrefix}${message}`);
            throw new Error(message);
        },
        outputNewline: () => {
            channel.appendLine('');
        },
    };
};
exports.default = decorateChannel;
//# sourceMappingURL=decorate.js.map