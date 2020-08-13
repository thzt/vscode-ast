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
const treeitem_1 = require("./treeitem");
class AstProvider {
    constructor(sourceFile) {
        this.sourceFile = sourceFile;
    }
    getTreeItem(astItem) {
        return __awaiter(this, void 0, void 0, function* () {
            return astItem;
        });
    }
    getChildren(astItem) {
        return __awaiter(this, void 0, void 0, function* () {
            // file can't be parsed 
            if (this.sourceFile == null) {
                return [];
            }
            // root node with no `astItem` passed
            if (astItem == null) {
                return [treeitem_1.default.create(this.sourceFile, this.sourceFile)];
            }
            return astItem.getChildren();
        });
    }
    getParent(astItem) {
        return __awaiter(this, void 0, void 0, function* () {
            return astItem.getParent();
        });
    }
}
exports.default = AstProvider;
//# sourceMappingURL=provider.js.map