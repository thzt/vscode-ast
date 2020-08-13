import * as ts from 'typescript';
import { TreeDataProvider } from 'vscode';

import AstItem from './treeitem';

class AstProvider implements TreeDataProvider<AstItem> {
  constructor(private sourceFile: ts.SourceFile) { }

  public async getTreeItem(astItem: AstItem) {
    return astItem;
  }

  public async getChildren(astItem?: AstItem) {
    // file can't be parsed 
    if (this.sourceFile == null) {
      return [];
    }

    // root node with no `astItem` passed
    if (astItem == null) {
      return [AstItem.create(this.sourceFile, this.sourceFile)];
    }

    return astItem.getChildren();
  }

  public async getParent(astItem: AstItem) {
    return astItem.getParent();
  }
}

export default AstProvider;
