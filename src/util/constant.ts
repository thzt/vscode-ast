const command = {
  // package.json#contributes.commands[].command
  focusAst: 'ast.focus',
};

// package.json#contributes.view.explorer[].id
const treeViewId = 'ast';

// tsconfig.json: default configuration
const defaultOptions = {
  allowJs: true,
};

const expandingLevel = 3;  // VSCode convention: TreeView maximum expanding level = 3
const delay = 100;  // retry delay time (ms)
const retry = 30 * 1000 / delay;  // retry times to wait TreeView loaded (30s)

const channelName = 'TypeScript AST';

const logPrefix = 'Info >> ';
const errorPrefix = 'Error >> ';

// empty function
const noop = () => { };

export {
  command,
  treeViewId,
  expandingLevel,
  retry,
  delay,

  channelName,
  logPrefix,
  errorPrefix,

  defaultOptions,
  noop,
};
