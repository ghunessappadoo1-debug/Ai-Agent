// File: server.js

const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Endpoint to Fetch Epics from Jira
app.post('/api/epics', async (req, res) => {
    const projectKey = process.env.JIRA_PROJECT_KEY;
    const jql = `project = "${projectKey}" AND issuetype = Epic ORDER BY created DESC`;
    const url = `${process.env.JIRA_BASE_URL}/rest/api/3/search/jql`;
    const auth = Buffer.from(`${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
    
    try {
        const response = await axios.post(url, 
            { jql: jql, fields: ["summary"] },
            { headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }}
        );
        const epics = response.data.issues.map(issue => ({ key: issue.key, summary: issue.fields.summary }));
        res.json(epics);
    } catch (error) {
        console.error('Error fetching epics from Jira:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: `Could not fetch epics for project '${projectKey}'.` });
    }
});

// Endpoint to Generate Content with Gemini AI
app.post('/api/generate', async (req, res) => {
    const { epicKey } = req.body;

    if (!epicKey) {
        return res.status(400).json({ error: 'Jira Epic Key is required.' });
    }

    try {
        const epicDetails = await fetchEpicFromJira(epicKey);
        const prompt = createPrompt(epicDetails);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const generatedContent = JSON.parse(cleanedJson);
        res.json(generatedContent);
    } catch (error) {
        console.error('Error processing request:', error.message);
        res.status(500).json({ error: 'Failed to process your request. Check server logs for details.' });
    }
});

// Endpoint to convert JSON to CSV
app.post('/api/convert/csv', (req, res) => {
    try {
        const jsonData = req.body;
        const csvData = convertToCSV(jsonData);
        res.header('Content-Type', 'text/csv');
        res.attachment('jira_stories.csv');
        res.send(csvData);
    } catch (error) {
        console.error('CSV Conversion Error:', error.message);
        res.status(500).json({ error: 'Failed to convert to CSV.' });
    }
});

// Endpoint to convert JSON to Confluence Markup
app.post('/api/convert/confluence', (req, res) => {
    try {
        const jsonData = req.body;
        const confluenceData = convertToConfluence(jsonData);
        res.header('Content-Type', 'text/plain');
        res.send(confluenceData);
    } catch (error) {
        console.error('Confluence Conversion Error:', error.message);
        res.status(500).json({ error: 'Failed to convert to Confluence markup.' });
    }
});

// --- Helper Functions ---

async function fetchEpicFromJira(epicKey) {
    const url = `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${epicKey}`;
    const auth = Buffer.from(`${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
    try {
        const response = await axios.get(url, { headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' } });
        const { summary, description } = response.data.fields;
        const descriptionText = description ? description.content.map(p => p.content.map(t => t.text).join('')).join('\n') : 'No description provided.';
        return { title: summary, description: descriptionText };
    } catch (error) {
        console.error('Error fetching from Jira:', error.response ? error.response.data : error.message);
        throw new Error(`Could not fetch Epic '${epicKey}' from Jira.`);
    }
}

function createPrompt(epic) {
    return `
        You are an expert Agile software development assistant. Your task is to analyze a Jira Epic and generate User Stories and their corresponding Test Cases.
        Based on this epic: Title: "${epic.title}", Description: "${epic.description}"
        Generate 3-5 user stories. For EACH story, provide "title", "description", "acceptanceCriteria" (as an array of strings in Given/When/Then format), and "storyPoints".
        For EACH story, also generate 2-3 test cases. For EACH test case, provide "testCaseId", "preconditions", "testSteps" (as an array of strings), and "expectedResults".
        Provide the final output ONLY in a valid JSON format. The root object should be { "userStories": [...] }.
    `;
}

// --- Data Conversion Functions (WITH FIXES) ---

function convertToCSV(data) {
    const headers = "User Story Title,Description,Acceptance Criteria,Story Points,Test Case ID,Preconditions,Test Steps,Expected Results";
    let csvRows = [headers];

    data.userStories.forEach(story => {
        // Ensure properties are handled safely
        const acArray = Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria : [story.acceptanceCriteria];
        
        const storyTitle = `"${story.title.replace(/"/g, '""')}"`;
        const description = `"${story.description.replace(/"/g, '""')}"`;
        const acceptanceCriteria = `"${acArray.join('\n').replace(/"/g, '""')}"`;
        
        story.testCases.forEach(tc => {
            const stepsArray = Array.isArray(tc.testSteps) ? tc.testSteps : [tc.testSteps];
            const row = [
                storyTitle,
                description,
                acceptanceCriteria,
                story.storyPoints,
                tc.testCaseId,
                `"${tc.preconditions.replace(/"/g, '""')}"`,
                `"${stepsArray.join('\n').replace(/"/g, '""')}"`,
                `"${tc.expectedResults.replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });
    });
    return csvRows.join('\n');
}

function convertToConfluence(data) {
    let markup = "";
    data.userStories.forEach(story => {
        // Ensure properties are handled safely
        const acArray = Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria : [story.acceptanceCriteria];

        markup += `h2. ${story.title}\n\n`;
        markup += `*Description:* ${story.description}\n`;
        markup += `*Story Points:* ${story.storyPoints}\n\n`;
        markup += `h3. Acceptance Criteria\n`;
        acArray.forEach(ac => { markup += `* ${ac}\n`; });
        markup += `\n\nh3. Test Cases\n`;
        markup += `||Test Case ID||Preconditions||Test Steps||Expected Results||\n`;
        story.testCases.forEach(tc => {
            const stepsArray = Array.isArray(tc.testSteps) ? tc.testSteps : [tc.testSteps];
            const steps = stepsArray.join('\\\\ ');
            markup += `|${tc.testCaseId}|${tc.preconditions}|${steps}|${tc.expectedResults}|\n`;
        });
        markup += `\n---\n`;
    });
    return markup;
}


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});