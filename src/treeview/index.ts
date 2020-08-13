import * as ts from 'typescript';
import { window, TextEditor, TreeView, Selection, commands } from 'vscode';

import { expandingLevel, treeViewId, retry, delay } from '../util/constant';
import createEmptyWatchProgram from '../util/watch';

import AstItem from './treeitem';
import AstProvider from './provider';

class TreeViewManager {
  private program: ts.WatchOfFilesAndCompilerOptions<ts.BuilderProgram>;
  private log: (message: string) => void;
  private error: (message: string) => void;

  // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

  private filePath: string;
  private textEditor: TextEditor;
  private sourceFile: ts.SourceFile;
  private treeView: TreeView<AstItem>;

  constructor({ log, error }) {
    // an empty program used to store parsed sourceFiles
    const program = createEmptyWatchProgram({
      onFileChanged: this.onFileChanged,
    });

    Object.assign(this, {
      program,
      log,
      error,
    });
  }

  public dispose() {
    this.unmount();
    this.program.close();

    this.log(`TreeViewManager dispose`);
  }

  // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

  // mount a file to display the TreeView
  public async mount(filePath) {
    if (filePath === this.filePath) {
      // no duplication
      return;
    }

    const textEditor = this.findTextEditorByFilePath(filePath);
    if (textEditor == null) {
      this.error(`Can't find file in VSCode editor: ${filePath}`);
      return;
    }
    this.textEditor = textEditor;

    this.log(`Mount file: ${filePath}`);
    const sourceFile = this.findOrCreateSourceFile(filePath);
    if (sourceFile == null) {
      this.log(`Can't parse file to AST: ${filePath}`);
      return;
    }
    this.sourceFile = sourceFile;

    this.log(`Create TreeView for: ${filePath}`);
    const treeView = this.createTreeView();

    await this.waitTreeViewLoaded(filePath, sourceFile);
    this.log(`TreeView loaded for: ${filePath}`);

    this.treeView = treeView;
    this.filePath = filePath;
  }

  public unmount() {
    if (this.filePath == null) {
      // already unmount
      return;
    }

    this.log(`Unmount file: ${this.filePath}`);
    this.treeView.dispose();
    AstItem.clear();

    this.textEditor = null;
    this.sourceFile = null;
    this.treeView = null;
    this.filePath = null;
  }

  // reveal AST node at cursor position 
  public async reveal(filePath: string) {
    this.log(`Reveal TreeView for: ${filePath}`);
    if (filePath === this.filePath) {
      await this.revealTreeView();
      return;
    }

    // Note:
    // sometimes VSCode missing trigger `onDidOpenTextDocument` on some out-of-project files
    // instead we mount the file manually
    this.unmount();
    await this.mount(filePath);
    await this.revealTreeView();
  }

  // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

  // arrow function to hold `this`
  private onFileChanged = async (filePath: string, eventKind: ts.FileWatcherEventKind) => {
    if (filePath !== this.filePath) {
      // only affect the current TreeView
      return;
    }

    switch (eventKind) {
      case ts.FileWatcherEventKind.Changed:
        this.log(`File changed: ${filePath}`);
        this.unmount();
        await this.mount(filePath);
        return;

      case ts.FileWatcherEventKind.Deleted:
        this.log(`File deleted: ${filePath}`);
        this.unmount();
        return;

      case ts.FileWatcherEventKind.Created:
        // nothing
        return;

      default:
        this.error(`Unsupported eventKind: ${Object.values(ts.FileWatcherEventKind)[eventKind]}`);
        return;
    }
  }

  // ---- ---- ---- ---- ---- ----

  private createTreeView() {
    const treeView = window.createTreeView(treeViewId, {
      treeDataProvider: new AstProvider(this.sourceFile),
      showCollapseAll: true,
    });

    // treeView' node click event
    treeView.onDidChangeSelection(this.onSelectionChanged);
    return treeView;
  }

  // arrow function to hold `this`
  private onSelectionChanged = async ({ selection: [astItem] }) => {
    this.log(`TreeView select changed: ${(astItem as AstItem).label}`);
    const { document } = this.textEditor;

    const [start, end] = astItem.getOffset();
    const [startPos, endPos] = [document.positionAt(start), document.positionAt(end)];
    this.textEditor.selection = new Selection(startPos, endPos);

    // ensure the cursor to focus to the document
    window.showTextDocument(document);

    // move cursor position to the center of the window
    await commands.executeCommand('revealLine', {
      lineNumber: startPos.line,
      at: 'center',
    });
  }

  // ---- ---- ---- ---- ---- ----

  private async revealTreeView() {
    const node = this.findNodeAtSelection();
    this.log(`Node kind: ${Object.values(ts.SyntaxKind)[node.kind]}`);

    const astItem = AstItem.search(node);
    await this.treeView.reveal(astItem, {
      focus: true,
      expand: expandingLevel,
    });
  }

  private findNodeAtSelection = () => {
    const { document, selections } = this.textEditor;

    const cursorPositions = selections.map(({ anchor, active, start, end }: Selection) => ({
      anchor: document.offsetAt(anchor),
      active: document.offsetAt(active),
      start: document.offsetAt(start),
      end: document.offsetAt(end),
    }));
    const [{ start, end }] = cursorPositions;

    if (start == end) {
      this.log(`Reveal TreeView at position: ${start}`);

      // get the ast node in the cursor position
      return (ts as any).getTouchingPropertyName(this.sourceFile, start);
    }

    const founds = this.findNodeAtRange(start, end);

    // can't find node exactly
    if (founds.length === 0) {
      this.log(`Can't find node exactly at range: [${start}, ${end})`);
      this.log(`Reveal TreeView at position: ${start}`);

      // get the ast node in the cursor position
      return (ts as any).getTouchingPropertyName(this.sourceFile, start);
    }

    // found more than one nodes
    const nodeKinds = founds.map(({ kind }) => kind);

    this.log(`Found more than one nodes: ${nodeKinds.join()}`);
    this.log(`Reveal the last one: ${nodeKinds.pop()}`);

    // return the last found one, may be the the leaf node
    return founds.pop().node;
  };

  // deep first search
  private dfs(current, getChildren, callback) {
    callback(current);
    for (const child of getChildren(current)) {
      this.dfs(child, getChildren, callback);
    }
  }

  private findNodeAtRange(start, end) {
    const founds = [];

    const getChildren = node => node.getChildren(this.sourceFile);
    this.dfs(this.sourceFile, getChildren, current => {
      const nodeKind = Object.values(ts.SyntaxKind)[current.kind];

      const isMatch = current.getStart(this.sourceFile) === start && current.getEnd() === end;
      if (!isMatch) {
        return;
      }

      founds.push({
        kind: nodeKind,
        node: current,
      });
    });

    return founds;
  }

  // ---- ---- ---- ---- ---- ----

  private findTextEditorByFilePath(filePath: string): TextEditor {
    const textEditor = window.visibleTextEditors.find(({ document: { fileName } }: TextEditor) => fileName === filePath);
    return textEditor;
  }

  private findOrCreateSourceFile(filePath) {
    const sourceFile = this.program.getProgram().getSourceFile(filePath);
    if (sourceFile != null) {
      return sourceFile;
    }

    this.log(`Watch file: ${filePath}`);
    this.program.updateRootFileNames([filePath]);
    const newSourceFile = this.program.getProgram().getSourceFile(filePath);
    return newSourceFile;
  }

  // ---- ---- ---- ---- ---- ----

  private async waitTreeViewLoaded(filePath, sourceFile) {
    let retryTimes = retry;
    while (true) {
      if (--retryTimes < 0) {
        this.error(`Waiting the TreeView ready for too long time: ${filePath}`);
        break;
      }

      // whether the root AST node loaded
      const astItem = AstItem.search(sourceFile);
      if (astItem != null) {
        break;
      }

      await new Promise(res => setTimeout(res, delay));
    }
  }
}

export default TreeViewManager;
