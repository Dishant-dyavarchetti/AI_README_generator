import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import * as fs from 'fs';

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
  } else {
    console.log('Environment variables loaded:', {
      hasHuggingFaceKey: !!process.env.HUGGINGFACE_API_KEY,
      hasBackendUrl: !!process.env.BACKEND_URL
    });
  }
} else {
  console.log('.env file not found in extension directory');
}

// Add this at the top of the file
interface ReadmeOption {
  content: string;
  style: string;
}

interface ProjectAnalysis {
  file_structure: any[];
  tech_stack: string[];
}

// Helper function to run terminal commands
function runCommand(command: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Command failed: ${command}\nError: ${error.message}\nStderr: ${stderr}`));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

async function analyzeProject(workspacePath: string): Promise<ProjectAnalysis> {
  try {
    const response = await axios.post('http://localhost:8000/api/analyze-project', {
      project_path: workspacePath
    }, { 
      timeout: 30000,  // Reduced to 30 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing project:', error);
    throw new Error('Failed to analyze project. Make sure the backend server is running.');
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('AI README Generator is now active!');
  
  // Register command to open the form panel
  const disposable = vscode.commands.registerCommand('ai-readme-generator.openForm', async () => {
    console.log('Command ai-readme-generator.openForm is being executed');
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
      }
      const workspacePath = workspaceFolders[0].uri.fsPath;
      const readmePath = path.join(workspacePath, 'README.md');

      // Check if README.md exists
      if (fs.existsSync(readmePath)) {
        const choice = await vscode.window.showInformationMessage(
          'A README.md already exists. What would you like to do?',
          'Generate New',
          'Use Existing',
          'Automate Git' // Option to automate Git for the existing README
        );

        if (choice === 'Use Existing') {
          const existingDoc = await vscode.workspace.openTextDocument(readmePath);
          await vscode.window.showTextDocument(existingDoc, vscode.ViewColumn.One);
          return;
        } else if (choice === 'Automate Git') {
          vscode.commands.executeCommand('ai-readme-generator.automateGit');
          return;
        } else if (choice !== 'Generate New') {
          // User cancelled the prompt
          return;
        }
        // If choice is 'Generate New', continue to open the form
      }

      // Proceed to open the form (if no README or user chose 'Generate New')
      const panel = vscode.window.createWebviewPanel(
        'readmeGenerator',
        'AI README Generator',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent();
      console.log('Webview panel created successfully');

      panel.webview.onDidReceiveMessage(async message => {
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
            } catch (error: unknown) {
              console.error('Error generating README:', error);
              if (error instanceof Error) {
                vscode.window.showErrorMessage(`Failed to generate README: ${error.message}`);
              } else {
                vscode.window.showErrorMessage('Failed to generate README: An unknown error occurred');
              }
            }
            return;
          case 'showReadmeOptions':
            showReadmeOptions(message.options);
            return;
        }
      });
    } catch (error) {
      console.error('Error creating webview panel:', error);
      vscode.window.showErrorMessage('Failed to open AI README Generator');
    }
  });

  context.subscriptions.push(disposable);
  console.log('AI README Generator command registered successfully');

  // Register command to automate Git process
  const gitAutomateDisposable = vscode.commands.registerCommand('ai-readme-generator.automateGit', async () => {
    console.log('Command ai-readme-generator.automateGit is being executed');

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder found.');
      return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;

    // Check if the workspace is a Git repository
    const gitPath = path.join(workspacePath, '.git');
    if (!fs.existsSync(gitPath)) {
      vscode.window.showErrorMessage('The current workspace is not a Git repository. Please run git init first.');
      return;
    }

    // Check if a remote is configured
    try {
      const remoteOutput = await runCommand('git remote -v', workspacePath);
      if (!remoteOutput) {
        vscode.window.showWarningMessage('No Git remote is configured for this repository. Git push may fail.');
      }
    } catch (error: any) {
      console.error('Error checking for Git remote:', error);
      // Continue even if checking remote fails, git push will handle it
    }

    // Prompt for commit message
    const commitMessage = await vscode.window.showInputBox({
      prompt: 'Enter commit message',
      placeHolder: 'feat: Add README.md'
    });

    if (!commitMessage) {
      vscode.window.showInformationMessage('Git commit cancelled.');
      return;
    }

    // Check and set Git user identity if needed
    let userName = '';
    let userEmail = '';
    try {
        userName = await runCommand('git config user.name', workspacePath);
        userEmail = await runCommand('git config user.email', workspacePath);
    } catch (error) {
        // Ignore errors, likely means config is not set
    }

    if (!userName || !userEmail) {
        vscode.window.showInformationMessage('Your Git user name and email are not configured. Please provide them to proceed.');

        const newUserName = await vscode.window.showInputBox({
            prompt: 'Enter your Git user name',
            placeHolder: 'Your Name'
        });

        if (!newUserName) {
            vscode.window.showInformationMessage('Git user name not provided. Git process cancelled.');
            return;
        }

        const newUserEmail = await vscode.window.showInputBox({
            prompt: 'Enter your Git user email',
            placeHolder: 'your.email@example.com'
        });

        if (!newUserEmail) {
            vscode.window.showInformationMessage('Git user email not provided. Git process cancelled.');
            return;
        }

        // Set Git user identity locally for this repository
        try {
            await runCommand(`git config user.name "${newUserName}"`, workspacePath);
            await runCommand(`git config user.email "${newUserEmail}"`, workspacePath);
            vscode.window.showInformationMessage('Git user identity configured.');
            userName = newUserName; // Update variables for commit
            userEmail = newUserEmail;
        } catch (error: any) {
            console.error('Error setting Git user identity:', error);
            vscode.window.showErrorMessage(`Failed to set Git user identity: ${error.message}`);
            return;
        }
    }

    // Ask for confirmation
    const confirmation = await vscode.window.showInformationMessage(
      `Are you sure you want to run git add ., git commit -m "${commitMessage}", and git push in ${path.basename(workspacePath)}?`,
      'Yes', 'No'
    );

    if (confirmation !== 'Yes') {
      vscode.window.showInformationMessage('Git process cancelled.');
      return;
    }

    // TODO: Implement Git command execution here
    // vscode.window.showInformationMessage('Git automation process initiated (Git command execution is not yet implemented).');

    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Automating Git process...',
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ message: 'Running git add .' });
        await runCommand('git add .', workspacePath);
        vscode.window.showInformationMessage('Git add completed.');

        // Check git status after add
        try {
            const statusOutput = await runCommand('git status', workspacePath);
            console.log('Git status after add:\n', statusOutput);
        } catch (statusError: any) {
            console.error('Error getting git status after add:', statusError);
        }

        progress.report({ message: `Running git commit -m "${commitMessage}"` });
        await runCommand(`git commit -m "${commitMessage}"`, workspacePath);
        vscode.window.showInformationMessage('Git commit completed.');

        progress.report({ message: 'Running git push' });
        await runCommand('git push', workspacePath);
        vscode.window.showInformationMessage('Git push completed.');

        vscode.window.showInformationMessage('Git process completed successfully!');
      } catch (error: any) {
        console.error('Error during Git automation:', error);
        
        // Explicitly include stderr in the user-facing error message
        let userErrorMessage = `Git automation failed: ${error.message}`;
        if (error.stderr) {
          userErrorMessage += `\nStderr: ${error.stderr}`;
          console.error('Git command stderr:', error.stderr); // Also log to console
        }
        
        vscode.window.showErrorMessage(userErrorMessage, { modal: true }); // Use modal to make it prominent
      }
    });

  });

  context.subscriptions.push(gitAutomateDisposable);

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(book) Generate README";
  statusBarItem.command = 'ai-readme-generator.openForm';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

function getWebviewContent(): string {
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

async function generateReadme(formData: any): Promise<ReadmeOption[]> {
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

    const response = await axios.post(
      'http://localhost:8000/api/generate-readme',
      {
        project_name: formData.projectName,
        description: formData.description,
        tech_stack: formData.tech_stack || [],
        file_structure: formData.file_structure || [],
        deployment_url: formData.deploymentLink,
        author_name: formData.authorName,
        author_email: formData.authorEmail,
        github_username: formData.githubUsername,
        functions: []
      },
      {
        timeout: 30000, // Reduced to 30 seconds
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeout);

    console.log('Response from backend:', response.data);

    if (!response.data) {
      throw new Error('Empty response from backend');
    }
    if (!Array.isArray(response.data.readme_variants)) {
      throw new Error('Invalid readme_variants format');
    }

    const readmeOptions: ReadmeOption[] = response.data.readme_variants.map((variant: any, index: number) => {
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
  } catch (error: any) {
    console.error('Error in axios POST to backend:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        vscode.window.showErrorMessage('Could not connect to backend server. Please ensure it is running on http://localhost:8000');
      } else if (error.response) {
        console.error('Backend Error Response:', error.response.data);
        vscode.window.showErrorMessage(
          `Backend Error (${error.response.status}): ${error.response.data.detail || error.response.statusText}`
        );
      } else if (error.request) {
        vscode.window.showErrorMessage('No response received from backend server. Please check your connection.');
      }
    } else {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
    throw error;
  }
}

function extractReadme(content: string, style: string): string {
  // Extract the README content for the specified style
  const regex = new RegExp(`${style}.*?\\n\\n([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function showReadmeOptions(options: ReadmeOption[]) {
  // Create a new webview panel to show the options
  const panel = vscode.window.createWebviewPanel(
    'readmeOptions',
    'Choose README Style',
    vscode.ViewColumn.One,
    {
      enableScripts: true
    }
  );

  // Set the webview content
  panel.webview.html = getReadmeOptionsWebviewContent(options);

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async message => {
      switch (message.command) {
        case 'selectReadme':
          const selectedReadme = options[message.index];
          if (selectedReadme) {
            // Keep the full content including the heading
            let content = selectedReadme.content.trim();
            
            // Remove the style indicator line (e.g., [Professional])
            content = content.replace(/^\[(Professional|Modern|Minimal)\]\s*\n/, '').trim();
            
            // Create a new untitled document with the selected README
            const doc = await vscode.workspace.openTextDocument({
              content: content,
              language: 'markdown'
            });
            
            // Show the document in a new editor
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            
            // Ask user if they want to save the file
            const saveResponse = await vscode.window.showInformationMessage(
              'Would you like to save this README?',
              'Save',
              'Cancel'
            );
            
            if (saveResponse === 'Save') {
              const workspaceFolders = vscode.workspace.workspaceFolders;
              if (workspaceFolders) {
                const readmePath = path.join(workspaceFolders[0].uri.fsPath, 'README.md');
                
                // Check if README.md already exists
                if (fs.existsSync(readmePath)) {
                  const overwriteResponse = await vscode.window.showWarningMessage(
                    'README.md already exists. Would you like to overwrite it?',
                    'Overwrite',
                    'Cancel'
                  );
                  
                  if (overwriteResponse !== 'Overwrite') {
                    return;
                  }
                }
                
                try {
                  // Save the file using fs.writeFileSync
                  fs.writeFileSync(readmePath, content, 'utf8');
                  vscode.window.showInformationMessage('README.md saved successfully!');
                  
                  // Open the saved file
                  const savedDoc = await vscode.workspace.openTextDocument(readmePath);
                  await vscode.window.showTextDocument(savedDoc, vscode.ViewColumn.One);
                } catch (error: any) {
                  console.error('Error saving README:', error);
                  vscode.window.showErrorMessage(`Failed to save README.md: ${error.message}`);
                }
              }
            }
          }
          return;
      }
    },
    undefined,
    []
  );
}

function getReadmeOptionsWebviewContent(options: ReadmeOption[]): string {
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

export function deactivate() {}