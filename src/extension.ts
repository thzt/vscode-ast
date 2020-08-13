
import { ExtensionContext, workspace, commands, window } from 'vscode';

import { command, channelName } from './util/constant';
import TreeViewManager from './treeview';
import decorateChannel from './util/decorate';

// singleton
const channel = window.createOutputChannel(channelName);
const { log, error, outputNewline } = decorateChannel(channel);

const treeViewManager = new TreeViewManager({
  log,
  error,
});

// todo: TreeView would be create/dispose multiple times while workspace event trigger too frequently
const activate = async (context: ExtensionContext) => {
  log(`Extension activate`);

  // open document event
  context.subscriptions.push(workspace.onDidOpenTextDocument(async e => {
    outputNewline();

    log(`workspace open TextDocument: ${e.fileName}`);
    if (window.activeTextEditor == null) {
      log(`No active editor`);
      return;
    }

    const filePath = window.activeTextEditor.document.fileName;
    log(`Current file: ${filePath}`);
    await treeViewManager.mount(filePath);
  }));

  // close document event
  context.subscriptions.push(workspace.onDidCloseTextDocument(e => {
    outputNewline();

    log(`workspace close TextDocument: ${e.fileName}`);
    treeViewManager.unmount();
  }));

  // treeView title click event: focus on the ast node at the cursor position
  context.subscriptions.push(commands.registerCommand(command.focusAst, async () => {
    outputNewline();

    log(`workspace command: ${command.focusAst}`);
    if (window.activeTextEditor == null) {
      log(`No active editor`);
      return;
    }

    const filePath = window.activeTextEditor.document.fileName;
    log(`Current file: ${filePath}`);
    await treeViewManager.reveal(filePath);
  }));
};

const deactivate = async () => {
  log(`Extension deactivate`);
  treeViewManager.dispose();
};

export {
  activate,
  deactivate,
};
