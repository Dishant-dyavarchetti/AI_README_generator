"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
// Load environment variables with detailed logging
console.log('Current working directory:', process.cwd());
// Get extension directory path
const extensionPath = path.resolve(__dirname, '..');
console.log('Extension path:', extensionPath);
// Try to load .env file from extension directory
const envPath = path.join(extensionPath, '.env');
console.log('Attempting to load .env from:', envPath);
if (fs.existsSync(envPath)) {
    console.log('.env file exists');
    const envConfig = dotenv.config({ path: envPath });
    if (envConfig.error) {
        console.error('Error loading .env file:', envConfig.error);
    }
    else {
        console.log('Environment variables loaded:', {
            hasHuggingFaceKey: !!process.env.HUGGINGFACE_API_KEY,
            hasBackendUrl: !!process.env.BACKEND_URL
        });
    }
}
else {
    console.log('.env file not found in extension directory');
}
async function analyzeProject(workspacePath) {
    try {
        const response = await axios_1.default.post('http://localhost:8000/api/analyze-project', {
            project_path: workspacePath
        }, {
            timeout: 30000, // Reduced to 30 seconds
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
    catch (error) {
        console.error('Error analyzing project:', error);
        throw new Error('Failed to analyze project. Make sure the backend server is running.');
    }
}
function activate(context) {
    console.log('AI README Generator is now active!');
    // Register command to open the form panel
    const disposable = vscode.commands.registerCommand('ai-readme-generator.openForm', async () => {
        console.log('Command ai-readme-generator.openForm is being executed');
        try {
            const panel = vscode.window.createWebviewPanel('readmeGenerator', 'AI README Generator', vscode.ViewColumn.One, {
                enableScripts: true,
            });
            panel.webview.html = getWebviewContent();
            console.log('Webview panel created successfully');
            panel.webview.onDidReceiveMessage(async (message) => {
                console.log('Received message from webview:', message);
                switch (message.command) {
                    case 'submitForm':
                        try {
                            console.log('Starting README generation with form data:', message.data);
                            vscode.window.showInformationMessage('Analyzing project...');
                            // Get workspace path
                            const workspaceFolders = vscode.workspace.workspaceFolders;
                            if (!workspaceFolders) {
                                throw new Error('No workspace folder found');
                            }
                            const workspacePath = workspaceFolders[0].uri.fsPath;
                            // Analyze project
                            const analysis = await analyzeProject(workspacePath);
                            console.log('Project analysis:', analysis);
                            // Combine user input with analysis
                            const projectData = {
                                ...message.data,
                                tech_stack: analysis.tech_stack,
                                file_structure: analysis.file_structure
                            };
                            console.log('Generating README with combined data...');
                            const readmeOptions = await generateReadme(projectData);
                            console.log('README options generated successfully:', readmeOptions);
                            showReadmeOptions(readmeOptions);
                        }
                        catch (error) {
                            console.error('Error generating README:', error);
                            if (error instanceof Error) {
                                vscode.window.showErrorMessage(`Failed to generate README: ${error.message}`);
                            }
                            else {
                                vscode.window.showErrorMessage('Failed to generate README: An unknown error occurred');
                            }
                        }
                        return;
                    case 'showReadmeOptions':
                        showReadmeOptions(message.options);
                        return;
                }
            });
        }
        catch (error) {
            console.error('Error creating webview panel:', error);
            vscode.window.showErrorMessage('Failed to open AI README Generator');
        }
    });
    context.subscriptions.push(disposable);
    console.log('AI README Generator command registered successfully');
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(book) Generate README";
    statusBarItem.command = 'ai-readme-generator.openForm';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}
function getWebviewContent() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>AI README Generator</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          padding: 16px;
          color: var(--vscode-editor-foreground);
          background-color: var(--vscode-editor-background);
        }
        input, textarea {
          width: 100%;
          margin-bottom: 12px;
          padding: 8px;
          font-size: 14px;
          box-sizing: border-box;
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 16px;
          border-radius: 4px;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        label {
          font-weight: bold;
          display: block;
          margin-bottom: 4px;
        }
        .info-text {
          color: var(--vscode-descriptionForeground);
          font-size: 12px;
          margin-top: -8px;
          margin-bottom: 12px;
        }
      </style>
    </head>
    <body>
      <h2>AI README Generator</h2>
      <p class="info-text">The extension will automatically analyze your project structure and tech stack.</p>
      
      <form id="readmeForm">
        <label for="projectName">Project Name *</label>
        <input id="projectName" name="projectName" type="text" required />

        <label for="description">Description</label>
        <textarea id="description" name="description" rows="3" placeholder="Brief description of your project"></textarea>

        <label for="deploymentLink">Deployment Link (if any)</label>
        <input id="deploymentLink" name="deploymentLink" type="url" placeholder="https://your-project.com" />

        <label for="authorName">Author Name</label>
        <input id="authorName" name="authorName" type="text" />

        <label for="authorEmail">Author Email</label>
        <input id="authorEmail" name="authorEmail" type="email" />

        <label for="githubUsername">GitHub Username</label>
        <input id="githubUsername" name="githubUsername" type="text" />

        <button type="submit">Generate README</button>
      </form>

      <script>
        const vscode = acquireVsCodeApi();
        const form = document.getElementById('readmeForm');

        form.addEventListener('submit', event => {
          event.preventDefault();

          const data = {};
          new FormData(form).forEach((value, key) => {
            data[key] = value;
          });

          vscode.postMessage({
            command: 'submitForm',
            data: data
          });
        });
      </script>
    </body>
    </html>
  `;
}
async function generateReadme(formData) {
    console.log('Generating README with form data:', formData);
    console.log('Sending request to backend at http://localhost:8000/api/generate-readme with data:', formData);
    try {
        // Validate input data first
        if (!formData.projectName) {
            throw new Error('Project name is required');
        }
        vscode.window.showInformationMessage('Generating README options...', { modal: false });
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // Reduced to 30 seconds
        const response = await axios_1.default.post('http://localhost:8000/api/generate-readme', {
            project_name: formData.projectName,
            description: formData.description,
            tech_stack: formData.tech_stack || [],
            file_structure: formData.file_structure || [],
            deployment_url: formData.deploymentLink,
            author_name: formData.authorName,
            author_email: formData.authorEmail,
            github_username: formData.githubUsername,
            functions: []
        }, {
            timeout: 30000, // Reduced to 30 seconds
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        clearTimeout(timeout);
        console.log('Response from backend:', response.data);
        if (!response.data) {
            throw new Error('Empty response from backend');
        }
        if (!Array.isArray(response.data.readme_variants)) {
            throw new Error('Invalid readme_variants format');
        }
        const readmeOptions = response.data.readme_variants.map((variant, index) => {
            if (!variant.content || !variant.style) {
                throw new Error(`Invalid variant format at index ${index}`);
            }
            return {
                content: variant.content,
                style: variant.style
            };
        });
        if (readmeOptions.length === 0) {
            throw new Error('No README variants generated');
        }
        vscode.window.showInformationMessage(`Generated ${readmeOptions.length} README options successfully!`);
        return readmeOptions;
    }
    catch (error) {
        console.error('Error in axios POST to backend:', error);
        if (axios_1.default.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                vscode.window.showErrorMessage('Could not connect to backend server. Please ensure it is running on http://localhost:8000');
            }
            else if (error.response) {
                console.error('Backend Error Response:', error.response.data);
                vscode.window.showErrorMessage(`Backend Error (${error.response.status}): ${error.response.data.detail || error.response.statusText}`);
            }
            else if (error.request) {
                vscode.window.showErrorMessage('No response received from backend server. Please check your connection.');
            }
        }
        else {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
        throw error;
    }
}
function extractReadme(content, style) {
    // Extract the README content for the specified style
    const regex = new RegExp(`${style}.*?\\n\\n([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
}
function showReadmeOptions(options) {
    // Create a new webview panel to show the options
    const panel = vscode.window.createWebviewPanel('readmeOptions', 'Choose README Style', vscode.ViewColumn.One, {
        enableScripts: true
    });
    // Set the webview content
    panel.webview.html = getReadmeOptionsWebviewContent(options);
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'selectReadme':
                const selectedReadme = options[message.index];
                if (selectedReadme) {
                    // Create a new untitled document with the selected README
                    const doc = await vscode.workspace.openTextDocument({
                        content: selectedReadme.content,
                        language: 'markdown'
                    });
                    // Show the document in a new editor
                    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                    // Ask user if they want to save the file
                    const saveResponse = await vscode.window.showInformationMessage('Would you like to save this README?', 'Save', 'Cancel');
                    if (saveResponse === 'Save') {
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (workspaceFolders) {
                            const readmePath = vscode.Uri.joinPath(workspaceFolders[0].uri, 'README.md');
                            // Check if README.md already exists
                            try {
                                await vscode.workspace.fs.stat(readmePath);
                                const overwriteResponse = await vscode.window.showWarningMessage('README.md already exists. Would you like to overwrite it?', 'Overwrite', 'Cancel');
                                if (overwriteResponse !== 'Overwrite') {
                                    return;
                                }
                            }
                            catch {
                                // File doesn't exist, proceed with save
                            }
                            // Save the file
                            const edit = new vscode.WorkspaceEdit();
                            edit.insert(readmePath, new vscode.Position(0, 0), selectedReadme.content);
                            await vscode.workspace.applyEdit(edit);
                            vscode.window.showInformationMessage('README saved successfully!');
                        }
                    }
                }
                return;
        }
    }, undefined, []);
}
function getReadmeOptionsWebviewContent(options) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Choose README Style</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          padding: 20px;
          color: var(--vscode-editor-foreground);
          background-color: var(--vscode-editor-background);
        }
        .option {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid var(--vscode-panel-border);
          border-radius: 4px;
        }
        .option h3 {
          margin-top: 0;
          color: var(--vscode-editor-foreground);
        }
        pre {
          background-color: var(--vscode-editor-background);
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          white-space: pre-wrap;
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
      </style>
    </head>
    <body>
      <h2>Choose a README Style</h2>
      ${options.map((option, index) => `
        <div class="option">
          <h3>${option.style} Style</h3>
          <pre>${option.content}</pre>
          <button onclick="selectReadme(${index})">Select This Version</button>
        </div>
      `).join('')}
      <script>
        const vscode = acquireVsCodeApi();
        function selectReadme(index) {
          vscode.postMessage({
            command: 'selectReadme',
            index: index
          });
        }
      </script>
    </body>
    </html>
  `;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map