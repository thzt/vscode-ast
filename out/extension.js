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
exports.deactivate = exports.activate = void 0;
const vscode_1 = require("vscode");
const constant_1 = require("./util/constant");
const treeview_1 = require("./treeview");
const decorate_1 = require("./util/decorate");
// singleton
const channel = vscode_1.window.createOutputChannel(constant_1.channelName);
const { log, error, outputNewline } = decorate_1.default(channel);
const treeViewManager = new treeview_1.default({
    log,
    error,
});
// todo: TreeView would be create/dispose multiple times while workspace event trigger too frequently
const activate = (context) => __awaiter(void 0, void 0, void 0, function* () {
    log(`Extension activate`);
    // open document event
    context.subscriptions.push(vscode_1.workspace.onDidOpenTextDocument((e) => __awaiter(void 0, void 0, void 0, function* () {
        outputNewline();
        log(`workspace open TextDocument: ${e.fileName}`);
        if (vscode_1.window.activeTextEditor == null) {
            log(`No active editor`);
            return;
        }
        const filePath = vscode_1.window.activeTextEditor.document.fileName;
        log(`Current file: ${filePath}`);
        yield treeViewManager.mount(filePath);
    })));
    // close document event
    context.subscriptions.push(vscode_1.workspace.onDidCloseTextDocument(e => {
        outputNewline();
        log(`workspace close TextDocument: ${e.fileName}`);
        treeViewManager.unmount();
    }));
    // treeView title click event: focus on the ast node at the cursor position
    context.subscriptions.push(vscode_1.commands.registerCommand(constant_1.command.focusAst, () => __awaiter(void 0, void 0, void 0, function* () {
        outputNewline();
        log(`workspace command: ${constant_1.command.focusAst}`);
        if (vscode_1.window.activeTextEditor == null) {
            log(`No active editor`);
            return;
        }
        const filePath = vscode_1.window.activeTextEditor.document.fileName;
        log(`Current file: ${filePath}`);
        yield treeViewManager.reveal(filePath);
    })));
});
exports.activate = activate;
const deactivate = () => __awaiter(void 0, void 0, void 0, function* () {
    log(`Extension deactivate`);
    treeViewManager.dispose();
});
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map