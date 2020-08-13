"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noop = exports.defaultOptions = exports.errorPrefix = exports.logPrefix = exports.channelName = exports.delay = exports.retry = exports.expandingLevel = exports.treeViewId = exports.command = void 0;
const command = {
    // package.json#contributes.commands[].command
    focusAst: 'ast.focus',
};
exports.command = command;
// package.json#contributes.view.explorer[].id
const treeViewId = 'ast';
exports.treeViewId = treeViewId;
// tsconfig.json: default configuration
const defaultOptions = {
    allowJs: true,
};
exports.defaultOptions = defaultOptions;
const expandingLevel = 3; // VSCode convention: TreeView maximum expanding level = 3
exports.expandingLevel = expandingLevel;
const delay = 100; // retry delay time (ms)
exports.delay = delay;
const retry = 30 * 1000 / delay; // retry times to wait TreeView loaded (30s)
exports.retry = retry;
const channelName = 'TypeScript AST';
exports.channelName = channelName;
const logPrefix = 'Info >> ';
exports.logPrefix = logPrefix;
const errorPrefix = 'Error >> ';
exports.errorPrefix = errorPrefix;
// empty function
const noop = () => { };
exports.noop = noop;
//# sourceMappingURL=constant.js.map