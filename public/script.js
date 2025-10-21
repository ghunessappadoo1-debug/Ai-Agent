// File: public/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const form = document.getElementById('jira-form');
    const fetchEpicsBtn = document.getElementById('fetch-epics-btn');
    const epicSelect = document.getElementById('epic-select');
    const generateBtn = document.getElementById('generate-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const resultsContainer = document.getElementById('results-container');
    const exportOptionsContainer = document.getElementById('export-options');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportConfluenceBtn = document.getElementById('export-confluence-btn');
    const rawOutputContainer = document.getElementById('raw-output-container');
    const rawOutputTextarea = document.getElementById('raw-output-textarea');

    // --- State Variable to store the generated data ---
    let currentGeneratedData = null;

    // --- Event Listeners ---

    // Fetch Epics from Jira
    fetchEpicsBtn.addEventListener('click', async () => {
        resetUIState();
        setLoading(true, 'Fetching epics from Jira...');
        try {
            const response = await fetch('/api/epics', { method: 'POST' });
            if (!response.ok) throw await createError(response);
            const epics = await response.json();
            populateEpicSelector(epics);
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    // Generate User Stories and display them
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const epicKey = epicSelect.value;
        if (!epicKey) {
            showError('Please select an Epic from the menu.');
            return;
        }
        resetUIState();
        setLoading(true, 'Generating, please wait...');
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ epicKey }),
            });
            if (!response.ok) throw await createError(response);
            
            currentGeneratedData = await response.json(); // Store the data
            displayResults(currentGeneratedData.userStories);
            exportOptionsContainer.style.display = 'block'; // Show export buttons
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    // Export to CSV
    exportCsvBtn.addEventListener('click', async () => {
        if (!currentGeneratedData) return;
        setLoading(true, 'Preparing CSV file...');
        try {
            const response = await fetch('/api/convert/csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentGeneratedData),
            });
            if (!response.ok) throw await createError(response);
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `epic-stories.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    // Get Confluence Markup
    exportConfluenceBtn.addEventListener('click', async () => {
        if (!currentGeneratedData) return;
        setLoading(true, 'Generating markup...');
        rawOutputContainer.style.display = 'none';
        try {
            const response = await fetch('/api/convert/confluence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentGeneratedData),
            });
            if (!response.ok) throw await createError(response);
            
            const markup = await response.text();
            rawOutputTextarea.value = markup;
            rawOutputContainer.style.display = 'block';
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    // --- UI Helper Functions ---

    function populateEpicSelector(epics) {
        epicSelect.innerHTML = '<option value="">-- Please select an epic --</option>';
        if (epics.length === 0) {
            epicSelect.innerHTML = '<option value="">-- No epics found in project --</option>';
            return;
        }
        epics.forEach(epic => {
            const option = document.createElement('option');
            option.value = epic.key;
            option.textContent = `${epic.key}: ${epic.summary}`;
            epicSelect.appendChild(option);
        });
        epicSelect.disabled = false;
        generateBtn.disabled = false;
    }

    function displayResults(userStories) {
        if (!userStories || userStories.length === 0) {
            resultsContainer.innerHTML = '<p>No user stories were generated.</p>';
            return;
        }
        resultsContainer.style.display = 'block';
        userStories.forEach(story => {
            const storyElement = document.createElement('article');
            storyElement.className = 'user-story';
            let testCasesHtml = story.testCases.map(tc => `
                <div class="test-case">
                    <h4>Test Case: ${tc.testCaseId}</h4>
                    <div class="test-case-details">
                        <p><strong>Preconditions:</strong> ${tc.preconditions}</p>
                        <p><strong>Test Steps:</strong></p>
                        <ol>${(Array.isArray(tc.testSteps) ? tc.testSteps : [tc.testSteps]).map(step => `<li>${step}</li>`).join('')}</ol>
                        <p><strong>Expected Results:</strong> ${tc.expectedResults}</p>
                    </div>
                </div>`).join('');
            storyElement.innerHTML = `
                <h3>${story.title} (Story Points: ${story.storyPoints})</h3>
                <div class="story-details">
                    <p><strong>Description:</strong> ${story.description}</p>
                    <p><strong>Acceptance Criteria:</strong></p>
                    <ul>${(Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria : [story.acceptanceCriteria]).map(ac => `<li>${ac}</li>`).join('')}</ul>
                </div>
                ${testCasesHtml}`;
            resultsContainer.appendChild(storyElement);
        });
    }

    function resetUIState() {
        resultsContainer.innerHTML = '';
        exportOptionsContainer.style.display = 'none';
        rawOutputContainer.style.display = 'none';
        errorMessage.style.display = 'none';
        currentGeneratedData = null;
    }
    
    function setLoading(isLoading, message = '') {
        loadingIndicator.textContent = message;
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
        generateBtn.setAttribute('aria-busy', String(isLoading));
        fetchEpicsBtn.setAttribute('aria-busy', String(isLoading));
    }

    function showError(message) {
        errorMessage.textContent = `Error: ${message}`;
        errorMessage.style.display = 'block';
    }

    async function createError(response) {
        const errorData = await response.json();
        return new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }
});
