import * as vscode from 'vscode';
import { format } from 'prettier';

const languages = ['javascript', 'javascriptreact'];

const channel = vscode.window.createOutputChannel('Prettier Target');

const regex = /^\s*(let|const)\s+[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*\s+=\s+styled\s*\.\s*.+?`(.|\n)*?`\s*/gm;

const prettierOptions = { semi: false, parser: 'babel' };

const formatter = (text: string, rangeStart: number, rangeEnd: number) => {
  const res = format(text, { ...prettierOptions, rangeStart, rangeEnd });
  return res;
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(languages, {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      const documentStart = document.lineAt(0).range.start;
      const documentEnd = document.lineAt(document.lineCount - 1).range.end;
      const documentRange = new vscode.Range(documentStart, documentEnd);
      const fullText = document.getText();
      const matches = [...fullText.matchAll((regex))].reverse();

      const formattedFullText = matches
        .reduce((oldFormattedFullText, match) => {
          const targetText = match[0];
          const targetTextStartOffset = match.index || 0;
          const targetTextEndOffset = targetTextStartOffset + targetText.length;

          const targetTextStart = document.positionAt(targetTextStartOffset);
          const targetTextEnd = document.positionAt(targetTextEndOffset);

          const updatedFormattedFullText = formatter(oldFormattedFullText, targetTextStartOffset, targetTextEndOffset);

          channel.appendLine(`formatted range from (l: ${targetTextStart.line}, r: ${targetTextStart.character}) to (l: ${targetTextEnd.line}, r: ${targetTextEnd.character})`);

          return updatedFormattedFullText;

        }, fullText);

      return [vscode.TextEdit.replace(documentRange, formattedFullText)];
    }
  }));
}

export function deactivate() { }
