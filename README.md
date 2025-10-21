AI-Powered Jira Agent for Agile Story & Test Case Generation
This project is a web-based application built for the "Principles of Software Development" assignment1. It serves as an AI-powered agent that connects to a live Jira instance, fetches project epics, and uses the Google Gemini AI to automatically generate detailed user stories and test cases222222222.
Features
•	Jira Integration: Securely connects to the Jira REST API to fetch a live list of project epics333333333.
•	AI-Powered Generation: Uses the Google Gemini AI to analyze an epic's title and description.
•	User Story Generation: Automatically creates user stories with:
o	Title 44
o	Description 55
o	Acceptance Criteria (in Given/When/Then format) 66
•	Test Case Generation: Automatically creates test cases for each story with:
o	Test Case ID 7
o	Preconditions 8
o	Test Steps 9
o	Expected Results 10
•	Multiple Export Formats: Displays the generated content in a clean web interface and allows for exporting as:
o	CSV File 1111
o	Confluence Wiki Markup 12121212
•	(Bonus) Effort Estimation: The AI also provides an estimated story point value (on the Fibonacci scale) for each generated user story13131313.
Technology Stack
•	Backend: Node.js, Express.js
•	Frontend: HTML5, CSS3, Vanilla JavaScript
•	APIs:
o	Jira REST API
o	Google Gemini API
•	Libraries: Axios, dotenv
Prerequisites
Before you begin, ensure you have the following installed on your system:
•	Node.js (which includes npm)
Installation & Setup
1.	Get the Source Code:
Unzip the project's source code folder (ai-jira-agent)14.
2.	Navigate to Project Directory:
Open a terminal and cd into the project's root folder:
Bash
cd path/to/ai-jira-agent
3.	Install Dependencies:
Run npm install to download all the required libraries (like Express, Axios, etc.) defined in package.json.
Bash
npm install
4.	Create Environment File:
In the root of the project, create a file named .env. This file will store your secret API keys and credentials.
5.	Edit .env File:
Copy and paste the following into your .env file, replacing the placeholder values with your actual credentials:
Code snippet
# --- .env file ---

# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_USER_EMAIL=your-jira-email@example.com
JIRA_API_TOKEN=your_jira_api_token_here
JIRA_PROJECT_KEY=YOUR_PROJECT_KEY

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
How to Run the Application
1.	Start the Server:
From the project's root directory, run the following command in your terminal:
Bash
node server.js
Alternatively, if you are using the start script from package.json:
Bash
npm start
2.	Open the Web Interface:
Open your web browser and navigate to:
http://localhost:3000
How to Use
1.	Fetch Epics: Click the "Fetch Epics from Project" button. The app will connect to Jira and populate the dropdown menu.
2.	Select Epic: Choose an epic from the dropdown list.
3.	Generate Content: Click the "Generate" button. The app will send the epic to the Gemini AI and display the resulting user stories and test cases on the page.
4.	Export Results: Once the results are shown, you can use the "Export Results" buttons to either "Download as CSV" or "Get Confluence Markup".
