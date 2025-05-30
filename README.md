# AI README Generator

A VS Code extension that generates professional README files using AI.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (v3.8 or higher)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)

## Environment Setup

1. Clone the repository:
```bash
git clone <your-repository-url>
cd ai-readme-generator
```

2. Set up the backend:
```bash
# Create and activate a virtual environment
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

3. Set up the frontend (VS Code extension):
```bash
# Install Node.js dependencies
npm install
```

4. Create environment files:
   - Create a `.env` file in the root directory with:
     ```
     GROQ_API_KEY=your_groq_api_key
     BACKEND_URL=http://localhost:8000
     ```
   - Create a `.env` file in the backend directory with:
     ```
     GROQ_API_KEY=your_groq_api_key
     ```

## Running the Project

1. Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload
```

2. Build and run the VS Code extension:
```bash
# In the root directory
npm run compile
npm run package
```

3. Install the extension in VS Code:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Click on "..." and select "Install from VSIX"
   - Choose the `.vsix` file from the `dist` directory

## Usage

1. Open any project in VS Code
2. Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS) to open the README generator
3. Fill in the required information in the form
4. Click "Generate" to create your README

## Development

- Backend API runs on `http://localhost:8000`
- API documentation is available at `http://localhost:8000/docs`
- The extension is configured to use the local backend by default

## Troubleshooting

1. If the extension doesn't work:
   - Check if the backend server is running
   - Verify your environment variables are set correctly
   - Check the VS Code Developer Tools console for errors

2. If the backend fails to start:
   - Ensure all Python dependencies are installed
   - Check if the required API keys are set in the `.env` file
   - Verify Python version compatibility

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

[Your License]

## Support

For support, please [create an issue](your-repository-issues-url) in the repository.
