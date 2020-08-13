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
const vscode_1 = require("vscode");
const constant_1 = require("../util/constant");
const watch_1 = require("../util/watch");
const treeitem_1 = require("./treeitem");
const provider_1 = require("./provider");
class TreeViewManager {
    constructor({ log, error }) {
        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        // arrow function to hold `this`
        this.onFileChanged = (filePath, eventKind) => __awaiter(this, void 0, void 0, function* () {
            if (filePath !== this.filePath) {
                // only affect the current TreeView
                return;
            }
            switch (eventKind) {
                case ts.FileWatcherEventKind.Changed:
                    this.log(`File changed: ${filePath}`);
                    this.unmount();
                    yield this.mount(filePath);
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
        });
        // arrow function to hold `this`
        this.onSelectionChanged = ({ selection: [astItem] }) => __awaiter(this, void 0, void 0, function* () {
            this.log(`TreeView select changed: ${astItem.label}`);
            const { document } = this.textEditor;
            const [start, end] = astItem.getOffset();
            const [startPos, endPos] = [document.positionAt(start), document.positionAt(end)];
            this.textEditor.selection = new vscode_1.Selection(startPos, endPos);
            // ensure the cursor to focus to the document
            vscode_1.window.showTextDocument(document);
            // move cursor position to the center of the window
            yield vscode_1.commands.executeCommand('revealLine', {
                lineNumber: startPos.line,
                at: 'center',
            });
        });
        this.findNodeAtSelection = () => {
            const { document, selections } = this.textEditor;
            const cursorPositions = selections.map(({ anchor, active, start, end }) => ({
                anchor: document.offsetAt(anchor),
                active: document.offsetAt(active),
                start: document.offsetAt(start),
                end: document.offsetAt(end),
            }));
            const [{ start, end }] = cursorPositions;
            if (start == end) {
                this.log(`Reveal TreeView at position: ${start}`);
                // get the ast node in the cursor position
                return ts.getTouchingPropertyName(this.sourceFile, start);
            }
            const founds = this.findNodeAtRange(start, end);
            // can't find node exactly
            if (founds.length === 0) {
                this.log(`Can't find node exactly at range: [${start}, ${end})`);
                this.log(`Reveal TreeView at position: ${start}`);
                // get the ast node in the cursor position
                return ts.getTouchingPropertyName(this.sourceFile, start);
            }
            // found more than one nodes
            const nodeKinds = founds.map(({ kind }) => kind);
            this.log(`Found more than one nodes: ${nodeKinds.join()}`);
            this.log(`Reveal the last one: ${nodeKinds.pop()}`);
            // return the last found one, may be the the leaf node
            return founds.pop().node;
        };
        // an empty program used to store parsed sourceFiles
        const program = watch_1.default({
            onFileChanged: this.onFileChanged,
        });
        Object.assign(this, {
            program,
            log,
            error,
        });
    }
    dispose() {
        this.unmount();
        this.program.close();
        this.log(`TreeViewManager dispose`);
    }
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    // mount a file to display the TreeView
    mount(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield this.waitTreeViewLoaded(filePath, sourceFile);
            this.log(`TreeView loaded for: ${filePath}`);
            this.treeView = treeView;
            this.filePath = filePath;
        });
    }
    unmount() {
        if (this.filePath == null) {
            // already unmount
            return;
        }
        this.log(`Unmount file: ${this.filePath}`);
        this.treeView.dispose();
        treeitem_1.default.clear();
        this.textEditor = null;
        this.sourceFile = null;
        this.treeView = null;
        this.filePath = null;
    }
    // reveal AST node at cursor position 
    reveal(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log(`Reveal TreeView for: ${filePath}`);
            if (filePath === this.filePath) {
                yield this.revealTreeView();
                return;
            }
            // Note:
            // sometimes VSCode missing trigger `onDidOpenTextDocument` on some out-of-project files
            // instead we mount the file manually
            this.unmount();
            yield this.mount(filePath);
            yield this.revealTreeView();
        });
    }
    // ---- ---- ---- ---- ---- ----
    createTreeView() {
        const treeView = vscode_1.window.createTreeView(constant_1.treeViewId, {
            treeDataProvider: new provider_1.default(this.sourceFile),
            showCollapseAll: true,
        });
        // treeView' node click event
        treeView.onDidChangeSelection(this.onSelectionChanged);
        return treeView;
    }
    // ---- ---- ---- ---- ---- ----
    revealTreeView() {
        return __awaiter(this, void 0, void 0, function* () {
            const node = this.findNodeAtSelection();
            this.log(`Node kind: ${Object.values(ts.SyntaxKind)[node.kind]}`);
            const astItem = treeitem_1.default.search(node);
            yield this.treeView.reveal(astItem, {
                focus: true,
                expand: constant_1.expandingLevel,
            });
        });
    }
    // deep first search
    dfs(current, getChildren, callback) {
        callback(current);
        for (const child of getChildren(current)) {
            this.dfs(child, getChildren, callback);
        }
    }
    findNodeAtRange(start, end) {
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
    findTextEditorByFilePath(filePath) {
        const textEditor = vscode_1.window.visibleTextEditors.find(({ document: { fileName } }) => fileName === filePath);
        return textEditor;
    }
    findOrCreateSourceFile(filePath) {
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
    waitTreeViewLoaded(filePath, sourceFile) {
        return __awaiter(this, void 0, void 0, function* () {
            let retryTimes = constant_1.retry;
            while (true) {
                if (--retryTimes < 0) {
                    this.error(`Waiting the TreeView ready for too long time: ${filePath}`);
                    break;
                }
                // whether the root AST node loaded
                const astItem = treeitem_1.default.search(sourceFile);
                if (astItem != null) {
                    break;
                }
                yield new Promise(res => setTimeout(res, constant_1.delay));
            }
        });
    }
}
exports.default = TreeViewManager;
//# sourceMappingURL=index.js.map