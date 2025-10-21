AI-Powered Jira Agent for Agile Story & Test Case Generation

This project is a web-based application built for the "Principles of Software Development" assignment. It serves as an AI-powered agent that connects to a live Jira instance, fetches project epics, and uses the Google Gemini AI to automatically generate detailed user stories and test cases.

Features:

Jira Integration: Securely connects to the Jira REST API to fetch a live list of project epics.
AI-Powered Generation: Uses the Google Gemini AI to analyze an epic's title and description.
User Story Generation: Automatically creates user stories with:
-Title
-Description
-Acceptance Criteria (in Given/When/Then format)
Test Case Generation: Automatically creates test cases for each story with:
-Test Case ID
-Preconditions
-Test Steps
-Expected Results
Multiple Export Formats: Displays the generated content in a clean web interface and allows for exporting as:
-CSV File
-Confluence Wiki Markup
(Bonus) Effort Estimation: The AI also provides an estimated story point value (on the Fibonacci scale) for each generated user story.
