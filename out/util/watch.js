"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const constant_1 = require("./constant");
const createEmptyWatchProgram = ({ onFileChanged }) => {
    const rootFiles = [];
    const options = constant_1.defaultOptions;
    // these two report callback is not required
    const reportDiagnostic = constant_1.noop;
    const reportWatchStatus = constant_1.noop;
    const host = ts.createWatchCompilerHost(rootFiles, options, ts.sys, ts.createEmitAndSemanticDiagnosticsBuilderProgram, reportDiagnostic, reportWatchStatus);
    // host's default `afterProgramCreate` will emit files, instead of doing nothing
    host.afterProgramCreate = constant_1.noop;
    // intercept file changed event and get the incremental parsing result
    const originalHostWatchFile = host.watchFile;
    host.watchFile = (path, callback, pollingInterval, options) => {
        return originalHostWatchFile(path, (fileName, eventKind) => __awaiter(void 0, void 0, void 0, function* () {
            callback(fileName, eventKind);
            yield onFileChanged(fileName, eventKind);
        }), pollingInterval, options);
    };
    const watchProgram = ts.createWatchProgram(host);
    return watchProgram;
};
exports.default = createEmptyWatchProgram;
//# sourceMappingURL=watch.js.map