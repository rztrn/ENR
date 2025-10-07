# Voyage Tracker JavaScript Documentation

## Overview
This JavaScript code creates an interactive voyage tracking system that displays vessel voyages in a filterable, sortable table with statistics scorecards.

## File Structure
- `static/js/voysummary.js` - Main JavaScript file containing all functionality

## How It Works

### 1. Data Loading
When the page loads, the code automatically:
- Fetches voyage data from your API endpoint
- Falls back to sample data if API fails
- Processes the data and renders the interface

### 2. Main Components

#### Scorecards (Statistics)
Shows summary statistics at the top:
- Total Vessels
- Active Voyages  
- Completed Voyages
- In Progress Voyages

#### Filter Panel
Allows users to filter voyages by:
- Vessels (ship names)
- Charter Types (Voyage, Time Charter, etc.)
- Charterers (companies)
- Ports (load and discharge ports)
- Status (Active, Completed, etc.)

#### Data Table
Displays voyage information with:
- Sortable columns
- Pagination (10 items per page)
- Port tags for multiple destinations

## Key Functions Explained

### `initializeVoyageTracker()`
**What it does:** Starts the entire application
**When it runs:** Automatically when page loads
**What it calls:** All other setup functions

\`\`\`javascript
// This is the main function that starts everything
function initializeVoyageTracker() {
    fetchVoyageData();  // Get data from API
    setupEventListeners();  // Set up button clicks
}
\`\`\`

### `fetchVoyageData()`
**What it does:** Gets voyage data from your server
**API Endpoint:** `/api/voyages/` (you can change this)
**Fallback:** Uses sample data if API fails

\`\`\`javascript
// This function gets data from your Django backend
async function fetchVoyageData() {
    try {
        const response = await fetch('/api/voyages/');
        const data = await response.json();
        // Process and display the data
    } catch (error) {
        // Use sample data if API fails
    }
}
\`\`\`

### `renderScoreCards(data)`
**What it does:** Creates the statistics boxes at the top
**Parameters:** 
- `data` - The complete voyage data object

\`\`\`javascript
// This counts different types of voyages and shows statistics
function renderScoreCards(data) {
    const totalVessels = data.vessels.length;
    const activeVoyages = data.voyages.filter(v => v.status === 'Active').length;
    // Updates the HTML elements with these numbers
}
\`\`\`

### `createPortTags(route, portType)`
**What it does:** Creates small tag elements for multiple ports
**Parameters:**
- `route` - Array of ports from voyage data
- `portType` - Either "load" or "discharge"
**Returns:** HTML string with port tags

\`\`\`javascript
// This creates small badges for each port
function createPortTags(route, portType) {
    const ports = route.filter(port => port.portType === portType);
    // Creates HTML like: <span class="svt-port-tag">IDTBN</span>
}
\`\`\`

### `applyFilters()`
**What it does:** Filters the voyage list based on selected checkboxes
**Updates:** The main data table with filtered results

\`\`\`javascript
// This function runs when user clicks filter checkboxes
function applyFilters() {
    // Gets all checked filters
    // Filters the voyage data
    // Updates the table display
}
\`\`\`

## Data Structure Expected

Your API should return data in this format:

\`\`\`json
{
  "vessels": [
    {
      "id": 1,
      "name": "VESSEL_NAME",
      "code": "VESSEL_CODE"
    }
  ],
  "charterTypes": [
    {
      "id": 1,
      "name": "Voyage Charter"
    }
  ],
  "charterers": [
    {
      "id": 1,
      "name": "COMPANY_NAME"
    }
  ],
  "voyages": [
    {
      "id": 1,
      "vesselId": 1,
      "charterTypeId": 1,
      "chartererId": 1,
      "status": "Active",
      "route": [
        {
          "portName": "IDTBN",
          "portType": "load",
          "arrivalDate": "2025-04-16T21:00:00Z"
        }
      ]
    }
  ]
}
\`\`\`

## HTML Elements Required

Your Django template must have these elements with exact IDs:

\`\`\`html
<!-- Scorecards -->
<div id="totalVessels">0</div>
<div id="activeVoyages">0</div>
<div id="completedVoyages">0</div>
<div id="inProgressVoyages">0</div>

<!-- Filter containers -->
<div id="vesselFilters"></div>
<div id="charterTypeFilters"></div>
<div id="chartererFilters"></div>
<div id="portFilters"></div>
<div id="statusFilters"></div>

<!-- Table -->
<tbody id="voyageTableBody"></tbody>

<!-- Pagination -->
<div id="paginationInfo"></div>
<div id="paginationControls"></div>
\`\`\`

## CSS Classes Used

The JavaScript adds these CSS classes (you need to style them):

\`\`\`css
.svt-port-tags-cell { /* Container for port tags */ }
.svt-port-tag { /* Individual port tag styling */ }
.svt-no-data { /* When no data available */ }
.svt-filter-item { /* Filter checkbox containers */ }
\`\`\`

## Customization Options

### Change Items Per Page
\`\`\`javascript
// In the code, find this line and change the number:
const itemsPerPage = 10; // Change to 20, 50, etc.
\`\`\`

### Change API Endpoint
\`\`\`javascript
// In fetchVoyageData function, change this URL:
const response = await fetch('/api/voyages/'); // Change to your endpoint
\`\`\`

### Add New Status Types
\`\`\`javascript
// In getStatusOptions function, add new statuses:
const statuses = ['Active', 'Completed', 'In Progress', 'Your New Status'];
\`\`\`

## Troubleshooting

### Data Not Loading
1. Check browser console for errors (F12 → Console tab)
2. Verify your API endpoint returns correct JSON format
3. Check if HTML elements have correct IDs

### Filters Not Working
1. Ensure filter container elements exist in HTML
2. Check if data has the expected field names
3. Verify checkbox event listeners are attached

### Table Not Displaying
1. Check if `voyageTableBody` element exists
2. Verify voyage data has required fields
3. Look for JavaScript errors in console

## Integration Steps

1. **Add the JavaScript file to your Django template:**
\`\`\`html
<script src="{% static 'js/voysummary.js' %}"></script>
\`\`\`

2. **Ensure your HTML has all required elements with correct IDs**

3. **Create your Django API endpoint that returns the expected JSON format**

4. **Add the required CSS classes for styling**

5. **Test in browser and check console for any errors**

## Beginner Tips

- **Console Logging:** Add `console.log()` statements to see what's happening
- **Browser DevTools:** Use F12 to inspect elements and see errors
- **Start Simple:** Test with sample data first, then connect to real API
- **One Step at a Time:** Implement one feature at a time and test it

## Common JavaScript Concepts Used

- **Async/Await:** For handling API calls
- **Array Methods:** `.filter()`, `.map()`, `.forEach()` for data processing
- **DOM Manipulation:** Changing HTML content with JavaScript
- **Event Listeners:** Responding to user clicks and interactions
- **Template Literals:** Using backticks (`) for HTML string creation
