// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';
import { WorkspaceFolder, Disposable } from 'vscode';
import { spawn } from 'child_process';

const execShell = (cmd: string) =>
	new Promise<string>((resolve, reject) => {
		cp.exec(cmd, (err, out) => {
			if (err) {
				return reject(err);
			}
			return resolve(out);
		});
	});


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-qmake" is now active!');

	let workspaces: ReadonlyArray<WorkspaceFolder> | undefined = vscode.workspace.workspaceFolders;
	if (workspaces) {
		const currentFolder = workspaces[0].uri;
		const buildFolder = vscode.Uri.parse(`${currentFolder.path}/build`);

		const channel = vscode.window.createOutputChannel(`qmake`);

		let commands: Disposable[] = [
			vscode.commands.registerCommand(`vscode-qmake.clean`, () => {
				channel.appendLine(`qmake: clean project, remove build folder.`);
				vscode.workspace.fs.delete(buildFolder, { recursive: true });
				vscode.window.showInformationMessage(`qmake: clean finished.`);
			}),
			vscode.commands.registerCommand(`vscode-qmake.qmake`, () => {
				// TODO: 如果存在多个pro文件，应该提供选择列表
				execShell(`mkdir -p ${buildFolder.path}`);
				channel.appendLine(`qmake: mkdir build folder.`);
				execShell(`cd ${buildFolder.path} && qmake ../ -r`);
			}),
			vscode.commands.registerCommand('vscode-qmake.build', () => {
				vscode.commands.executeCommand(`vscode-qmake.qmake`);
				const build = spawn(`cd`, [`${buildFolder.path}`, "&&", "bear", "--", "make", "-j$(nproc)"]);
				build.stdout.on("data", data => {
					channel.appendLine(data);
				});
				build.stderr.on("error", error => {
					channel.appendLine(error.message);
				});
				build.on("exit", code => {
					if (code !== 0) {
						vscode.window.showErrorMessage(`project build failed!`);
						return;
					}

					vscode.commands.executeCommand(`ccls.restart`);
				});
			})
		];

		commands.forEach((command: Disposable) => context.subscriptions.push(command));
	}
	else {
		vscode.window.showInformationMessage(`not exist pro file!`);
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
