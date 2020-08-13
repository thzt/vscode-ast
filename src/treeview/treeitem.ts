import * as ts from 'typescript';
import { TreeItemCollapsibleState, TreeItem } from "vscode";

class AstItem extends TreeItem {
  private sourceFile: ts.SourceFile;
  private node: ts.Node;

  // ---- ---- ---- ---- ---- ---- ---- ---- ----
  // factory method: `treeView.reveal` use it to find `astItem` by `node`

  private static nodeToItemRelation = new Map<ts.Node, AstItem>();

  public static create(sourceFile: ts.SourceFile, node: ts.Node) {
    const astItem = new this(sourceFile, node);
    this.nodeToItemRelation.set(node, astItem);

    return astItem;
  }

  public static search(node: ts.Node) {
    return this.nodeToItemRelation.get(node);
  }

  public static clear() {
    this.nodeToItemRelation.clear();
  }

  private constructor(sourceFile: ts.SourceFile, node: ts.Node) {

    // initialize super class
    const label = AstItem.getNodeKind(node);

    const isLeaf = node.getChildren(sourceFile).length === 0;
    const collapsibleState = isLeaf ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Expanded;

    super(label, collapsibleState);

    // set description property
    const [start, end] = [node.getStart(sourceFile), node.getEnd()];
    this.description = `[${start}, ${end})`;

    const { symbol } = node as any;
    if (symbol != null) {
      this.description += ` -> Symbol: ${symbol.name}`;
    }

    // set other properties in the instance
    Object.assign(this, {
      sourceFile,
      node,
    });
  }

  // ---- ---- ---- ---- ---- ---- ---- ---- ----

  public getOffset() {
    return [this.node.getStart(this.sourceFile), this.node.getEnd()];
  }

  public getChildren() {
    return this.node.getChildren(this.sourceFile)
      .map((node: ts.Node) => AstItem.create(this.sourceFile, node));
  }

  public getParent() {
    return AstItem.create(this.sourceFile, this.node.parent);
  }

  // ---- ---- ---- ---- ---- ---- ---- ---- ----

  private static getNodeKind(node: ts.Node): string {
    return Object.values(ts.SyntaxKind)[node.kind] as string;
  }
}

export default AstItem;
