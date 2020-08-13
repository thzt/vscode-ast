"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const vscode_1 = require("vscode");
class AstItem extends vscode_1.TreeItem {
    constructor(sourceFile, node) {
        // initialize super class
        const label = AstItem.getNodeKind(node);
        const isLeaf = node.getChildren(sourceFile).length === 0;
        const collapsibleState = isLeaf ? vscode_1.TreeItemCollapsibleState.None : vscode_1.TreeItemCollapsibleState.Expanded;
        super(label, collapsibleState);
        // set description property
        const [start, end] = [node.getStart(sourceFile), node.getEnd()];
        this.description = `[${start}, ${end})`;
        const { symbol } = node;
        if (symbol != null) {
            this.description += ` -> Symbol: ${symbol.name}`;
        }
        // set other properties in the instance
        Object.assign(this, {
            sourceFile,
            node,
        });
    }
    static create(sourceFile, node) {
        const astItem = new this(sourceFile, node);
        this.nodeToItemRelation.set(node, astItem);
        return astItem;
    }
    static search(node) {
        return this.nodeToItemRelation.get(node);
    }
    static clear() {
        this.nodeToItemRelation.clear();
    }
    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    getOffset() {
        return [this.node.getStart(this.sourceFile), this.node.getEnd()];
    }
    getChildren() {
        return this.node.getChildren(this.sourceFile)
            .map((node) => AstItem.create(this.sourceFile, node));
    }
    getParent() {
        return AstItem.create(this.sourceFile, this.node.parent);
    }
    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    static getNodeKind(node) {
        return Object.values(ts.SyntaxKind)[node.kind];
    }
}
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// factory method: `treeView.reveal` use it to find `astItem` by `node`
AstItem.nodeToItemRelation = new Map();
exports.default = AstItem;
//# sourceMappingURL=treeitem.js.map