// DEFINE CONSTANTS FOR RANK OPTIONS
const MILITARY_RANKS = ['Col', 'Lt Col', 'Maj', 'Capt', '1st Lt', '2nd Lt'];
const CIVILIAN_RANKS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Instructor', 'GS-15', 'GS-11', 'GS-9', 'GS-7'];

// MOCK DATA SEED
const MOCK_DATA = {
  isAY: true,
  startYear: 2025,
  theme: 'dark',
  simulationDate: '2026-06-16',
  sidebarCollapsed: false,
  metricsCollapsed: false,
  metadataCollapsed: false,
  headerCollapsed: false,
  timelineSpan: 3,
  programs: [
    { code: "ME", name: "Mechanical Engineering (ME)" },
    { code: "SE", name: "Systems Engineering (SE)" },
    { code: "CAStLE", name: "CAStLE" },
    { code: "Lab", name: "Lab" },
    { code: "FO", name: "Front Office (FO)" }
  ],
  billets: [],
  personnel: [],
  assignments: []
};

// ACTIVE APPLICATION STATE
let state = {};

// INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  
  // Ensure state defaults exist
  if (state.sidebarCollapsed === undefined) state.sidebarCollapsed = false;
  if (state.metricsCollapsed === undefined) state.metricsCollapsed = false;
  if (state.metadataCollapsed === undefined) state.metadataCollapsed = false;
  if (state.headerCollapsed === undefined) state.headerCollapsed = false;
  if (state.timelineSpan === undefined) state.timelineSpan = 3;
  
  applyTheme();
  applySidebarState();
  applyMetricsState();
  applyMetadataState();
  applyHeaderState();
  initDateInputs();
  
  // Set dropdown selection
  document.getElementById('timelineSpanSelect').value = state.timelineSpan;
  
  setupEventListeners();
  renderAll();
});

function setupEventListeners() {
  // Autofill tour end date to 3 years after arrival date
  document.getElementById('personFormArrival').addEventListener('change', (e) => {
    const arrivalVal = e.target.value;
    if (arrivalVal) {
      const arrDate = new Date(arrivalVal + 'T00:00:00');
      arrDate.setFullYear(arrDate.getFullYear() + 3);
      
      const yyyy = arrDate.getFullYear();
      const mm = String(arrDate.getMonth() + 1).padStart(2, '0');
      const dd = String(arrDate.getDate()).padStart(2, '0');
      document.getElementById('personFormDeparture').value = `${yyyy}-${mm}-${dd}`;
    }
  });

  // Autofill assignment dates from personnel tour dates
  document.getElementById('assignPersonSelect').addEventListener('change', (e) => {
    const personId = e.target.value;
    const person = state.personnel.find(p => p.id === personId);
    if (person) {
      document.getElementById('assignStartDate').value = person.arrival || '';
      document.getElementById('assignEndDate').value = person.departure || '';
    }
  });
}

// STATE NORMALIZATION FOR BACKWARD COMPATIBILITY
function normalizeState() {
  if (!state) return;
  if (!state.programs || state.programs.length === 0) {
    state.programs = [
      { code: "ME", name: "Mechanical Engineering (ME)" },
      { code: "SE", name: "Systems Engineering (SE)" },
      { code: "CAStLE", name: "CAStLE" },
      { code: "Lab", name: "Lab" },
      { code: "FO", name: "Front Office (FO)" }
    ];
  } else {
    const defaults = [
      { code: "ME", name: "Mechanical Engineering (ME)" },
      { code: "SE", name: "Systems Engineering (SE)" },
      { code: "CAStLE", name: "CAStLE" },
      { code: "Lab", name: "Lab" },
      { code: "FO", name: "Front Office (FO)" }
    ];
    defaults.forEach(d => {
      if (!state.programs.some(p => p.code === d.code)) {
        state.programs.push(d);
      }
    });
  }
  if (!state.billets) state.billets = [];
  if (!state.personnel) state.personnel = [];
  else {
    state.personnel.forEach(p => {
      if (p.careerField === undefined) {
        p.careerField = '';
      }
    });
  }
  if (!state.assignments) state.assignments = [];
  if (state.isAY === undefined) state.isAY = true;
  if (state.startYear === undefined) state.startYear = 2025;
  if (!state.simulationDate) state.simulationDate = '2026-06-16';
  if (!state.theme) state.theme = 'dark';
  if (state.sidebarCollapsed === undefined) state.sidebarCollapsed = false;
  if (state.metricsCollapsed === undefined) state.metricsCollapsed = false;
  if (state.metadataCollapsed === undefined) state.metadataCollapsed = false;
  if (state.headerCollapsed === undefined) state.headerCollapsed = false;
  if (state.timelineSpan === undefined) state.timelineSpan = 3;
}

// LOAD STATE FROM LOCAL STORAGE OR SEED DATA
function loadState() {
  const stored = localStorage.getItem('manning_tool_state');
  if (stored) {
    try {
      state = JSON.parse(stored);
      normalizeState();
    } catch (e) {
      console.error("Failed to parse stored state. Resetting to mock data.", e);
      state = JSON.parse(JSON.stringify(MOCK_DATA));
      normalizeState();
    }
  } else {
    state = JSON.parse(JSON.stringify(MOCK_DATA));
    normalizeState();
  }
}

// SAVE STATE TO LOCAL STORAGE
function saveState() {
  localStorage.setItem('manning_tool_state', JSON.stringify(state));
}

// CLEAR DB
function clearDatabase() {
  if (confirm("Are you sure you want to clear all billets, personnel, and assignments? This cannot be undone.")) {
    state.billets = [];
    state.personnel = [];
    state.assignments = [];
    saveState();
    initDateInputs();
    applyTheme();
    renderAll();
  }
}

// FILE IMPORT/EXPORT
function exportData() {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `manning_${yyyy}-${mm}-${dd}_${hh}${min}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV() {
  function escapeCSV(val) {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  const headers = ["Billet Code", "Duty Title", "Program", "Role", "Assigned Name", "Rank", "Tour Start", "Tour End", "Career Field"];
  const csvRows = [headers.join(",")];
  
  const sortedBillets = [...state.billets].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
  
  sortedBillets.forEach(b => {
    const activeAsg = state.assignments.find(a => 
      a.billetId === b.id && 
      state.simulationDate >= a.startDate && 
      state.simulationDate <= a.endDate
    );
    const person = activeAsg ? state.personnel.find(p => p.id === activeAsg.personnelId) : null;
    
    const row = [
      escapeCSV(b.code),
      escapeCSV(b.title),
      escapeCSV(b.program),
      escapeCSV(b.role),
      person ? escapeCSV(person.name) : "",
      person ? escapeCSV(person.rank) : "",
      person ? escapeCSV(person.arrival) : "",
      person ? escapeCSV(person.departure) : "",
      person ? escapeCSV(person.careerField) : ""
    ];
    csvRows.push(row.join(","));
  });
  
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'manning_roster.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.billets && imported.personnel && imported.assignments) {
        state = imported;
        normalizeState();
        saveState();
        initDateInputs();
        applyTheme();
        renderAll();
        alert("Database imported successfully!");
      } else {
        alert("Invalid file format. Make sure it contains billets, personnel, and assignments.");
      }
    } catch (err) {
      alert("Error parsing JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // clear input
}

// RFC-4180 COMPLIANT CSV PARSER
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      lines.push(row.map(cell => cell.trim()));
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row.map(cell => cell.trim()));
  }
  return lines.filter(r => r.length > 0 && r.some(cell => cell !== ""));
}

// EXCEL DATE FORMAT NORMALIZER
function parseCSVDate(dateStr) {
  if (!dateStr) return '';
  const str = dateStr.trim();
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  const parts = str.split('/');
  if (parts.length === 3) {
    const mm = parts[0].padStart(2, '0');
    const dd = parts[1].padStart(2, '0');
    let yyyy = parts[2];
    if (yyyy.length === 2) {
      yyyy = '20' + yyyy;
    }
    return `${yyyy}-${mm}-${dd}`;
  }
  
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch (e) {}
  
  return '';
}

// MAP CSV HEADER LABELS TO INDICES
function mapHeaders(headerRow) {
  const mapping = {};
  headerRow.forEach((val, idx) => {
    const key = val.trim().toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // remove special chars
      .replace(/\s+/g, ' ');       // collapse spaces
    mapping[key] = idx;
  });
  return mapping;
}

// BULK IMPORT BILLETS CSV
function importBilletsCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        showCSVImportSummary("Error: The selected CSV file is empty or missing data rows.", "danger");
        return;
      }

      const headerRow = rows[0];
      const headerMap = mapHeaders(headerRow);

      const codeIdx = headerMap['code'] !== undefined ? headerMap['code'] : headerMap['billet code'];
      const titleIdx = headerMap['title'] !== undefined ? headerMap['title'] : headerMap['duty title'];
      const programIdx = headerMap['program'];
      const typeIdx = headerMap['type'];
      const roleIdx = headerMap['role'];
      const rankIdx = headerMap['required rank'] !== undefined ? headerMap['required rank'] : headerMap['rank'];

      if (codeIdx === undefined) {
        showCSVImportSummary("Error: Missing required column 'Code' or 'Billet Code' in CSV header.", "danger");
        return;
      }

      let importCount = 0;
      let duplicateCount = 0;
      let skippedCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const code = row[codeIdx] ? row[codeIdx].trim() : '';

        if (!code) {
          skippedCount++;
          continue;
        }

        const exists = state.billets.some(b => b.code.toLowerCase() === code.toLowerCase());
        if (exists) {
          duplicateCount++;
          continue;
        }

        const title = titleIdx !== undefined && row[titleIdx] ? row[titleIdx].trim() : '';
        const rawProg = programIdx !== undefined && row[programIdx] ? row[programIdx].trim() : 'ME';
        
        // Check if matches existing program
        let program = 'ME';
        if (rawProg) {
          const matchedProg = state.programs.find(p => 
            p.code.toLowerCase() === rawProg.toLowerCase() ||
            p.name.toLowerCase() === rawProg.toLowerCase()
          );
          if (matchedProg) {
            program = matchedProg.code;
          } else {
            // Register new program dynamically!
            const cleanCode = rawProg.toUpperCase().replace(/\s+/g, '');
            state.programs.push({
              code: cleanCode,
              name: rawProg
            });
            program = cleanCode;
          }
        }
        
        const rawType = typeIdx !== undefined && row[typeIdx] ? row[typeIdx].trim().toLowerCase() : 'military';
        const type = (rawType.startsWith('civ') || rawType === 'civilian') ? 'Civilian' : 'Military';

        const rawRole = roleIdx !== undefined && row[roleIdx] ? row[roleIdx].trim().toLowerCase() : 'faculty';
        const role = (rawRole.startsWith('st') || rawRole === 'staff') ? 'Staff' : 'Faculty';

        const requiredRank = rankIdx !== undefined && row[rankIdx] ? row[rankIdx].trim() : '';

        state.billets.push({
          id: 'B-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          code,
          title,
          program,
          type,
          role,
          requiredRank
        });
        importCount++;
      }

      saveState();
      renderAll();
      showCSVImportSummary(`<strong>Billet Import Successful:</strong><br>• Imported: ${importCount} positions<br>• Skipped (duplicate code): ${duplicateCount}<br>• Skipped (missing code): ${skippedCount}`, "success");
    } catch (err) {
      showCSVImportSummary("Error parsing CSV: " + err.message, "danger");
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // clear input
}

// BULK IMPORT PERSONNEL CSV WITH AUTO-ASSIGNMENT
function importPersonnelCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        showCSVImportSummary("Error: The selected CSV file is empty or missing data rows.", "danger");
        return;
      }

      const headerRow = rows[0];
      const headerMap = mapHeaders(headerRow);

      const nameIdx = headerMap['name'] !== undefined ? headerMap['name'] : headerMap['full name'];
      const rankIdx = headerMap['rank'];
      const typeIdx = headerMap['type'];
      const roleIdx = headerMap['role'];
      const arrivalIdx = headerMap['arrival date'] !== undefined ? headerMap['arrival date'] : headerMap['arrival'];
      const departureIdx = headerMap['departure date'] !== undefined ? headerMap['departure date'] : headerMap['departure'];
      const billetCodeIdx = headerMap['assigned billet code'] !== undefined ? headerMap['assigned billet code'] : headerMap['billet code'];
      const careerFieldIdx = headerMap['career field'] !== undefined ? headerMap['career field'] : headerMap['careerfield'];

      if (nameIdx === undefined) {
        showCSVImportSummary("Error: Missing required column 'Name' or 'Full Name' in CSV header.", "danger");
        return;
      }

      let importCount = 0;
      let skippedCount = 0;
      let autoAssignCount = 0;

      const bounds = getTimelineBounds();
      const boundsStartStr = bounds.startDate.getFullYear() + '-' + String(bounds.startDate.getMonth() + 1).padStart(2, '0') + '-' + String(bounds.startDate.getDate()).padStart(2, '0');
      const boundsEndStr = bounds.endDate.getFullYear() + '-' + String(bounds.endDate.getMonth() + 1).padStart(2, '0') + '-' + String(bounds.endDate.getDate()).padStart(2, '0');

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = row[nameIdx] ? row[nameIdx].trim() : '';

        if (!name) {
          skippedCount++;
          continue;
        }

        const rank = rankIdx !== undefined && row[rankIdx] ? row[rankIdx].trim() : '';
        
        const rawType = typeIdx !== undefined && row[typeIdx] ? row[typeIdx].trim().toLowerCase() : 'military';
        const type = (rawType.startsWith('civ') || rawType === 'civilian') ? 'Civilian' : 'Military';

        const rawRole = roleIdx !== undefined && row[roleIdx] ? row[roleIdx].trim().toLowerCase() : 'faculty';
        const role = (rawRole.startsWith('st') || rawRole === 'staff') ? 'Staff' : 'Faculty';

        const arrival = arrivalIdx !== undefined && row[arrivalIdx] ? parseCSVDate(row[arrivalIdx]) : '';
        const departure = departureIdx !== undefined && row[departureIdx] ? parseCSVDate(row[departureIdx]) : '';
        const billetCode = billetCodeIdx !== undefined && row[billetCodeIdx] ? row[billetCodeIdx].trim() : '';
        const careerField = careerFieldIdx !== undefined && row[careerFieldIdx] ? row[careerFieldIdx].trim() : '';

        const personId = 'P-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        state.personnel.push({
          id: personId,
          name,
          rank,
          type,
          role,
          arrival,
          departure,
          careerField
        });
        importCount++;

        // Auto-Assignment Logic
        if (billetCode) {
          const matchingBillet = state.billets.find(b => b.code.toLowerCase() === billetCode.toLowerCase());
          if (matchingBillet) {
            const defaultStart = arrival || boundsStartStr;
            const defaultEnd = departure || boundsEndStr;

            state.assignments.push({
              id: 'A-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              billetId: matchingBillet.id,
              personnelId: personId,
              startDate: defaultStart,
              endDate: defaultEnd
            });
            autoAssignCount++;
          }
        }
      }

      saveState();
      renderAll();
      showCSVImportSummary(`<strong>Personnel Import Successful:</strong><br>• Imported: ${importCount} people<br>• Automatically Assigned: ${autoAssignCount} to matching billets<br>• Skipped (missing name): ${skippedCount}`, "success");
    } catch (err) {
      showCSVImportSummary("Error parsing CSV: " + err.message, "danger");
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // clear input
}

// SHOW CSV IMPORT NOTIFICATION PANEL
function showCSVImportSummary(msg, type) {
  const panel = document.getElementById('csvImportSummary');
  panel.style.display = 'block';
  panel.innerHTML = msg;
  
  if (type === "success") {
    panel.style.backgroundColor = "rgba(16, 185, 129, 0.1)";
    panel.style.borderColor = "var(--success)";
    panel.style.color = "var(--success)";
  } else {
    panel.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
    panel.style.borderColor = "var(--danger)";
    panel.style.color = "var(--danger)";
  }
}

// THEME HANDLING
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveState();
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const icon = document.getElementById('themeIcon');
  if (state.theme === 'light') {
    icon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"></path>';
  } else {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }
}

// VIEW toggles and managers
function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  saveState();
  applySidebarState();
}

function applySidebarState() {
  const container = document.querySelector('.app-container');
  const icon = document.getElementById('sidebarToggleIcon');
  if (state.sidebarCollapsed) {
    container.classList.add('sidebar-collapsed');
    icon.innerHTML = '<polyline points="9 18 15 12 9 6"></polyline>'; // Chevron right (expand)
  } else {
    container.classList.remove('sidebar-collapsed');
    icon.innerHTML = '<polyline points="15 18 9 12 15 6"></polyline>'; // Chevron left (collapse)
  }
}

function toggleMetrics() {
  state.metricsCollapsed = !state.metricsCollapsed;
  saveState();
  applyMetricsState();
}

function applyMetricsState() {
  const wrapper = document.getElementById('metricsWrapper');
  const btnText = document.getElementById('metricsHeaderToggleText');
  const icon = document.getElementById('metricsHeaderToggleIcon');
  if (state.metricsCollapsed) {
    wrapper.classList.add('collapsed');
    if (btnText) btnText.textContent = 'Show Dashboard';
    if (icon) icon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>'; // Chevron down
  } else {
    wrapper.classList.remove('collapsed');
    if (btnText) btnText.textContent = 'Hide Dashboard';
    if (icon) icon.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>'; // Chevron up
  }
}

function toggleHeader() {
  state.headerCollapsed = !state.headerCollapsed;
  saveState();
  applyHeaderState();
}

function applyHeaderState() {
  const container = document.querySelector('.app-container');
  if (state.headerCollapsed) {
    container.classList.add('header-collapsed');
  } else {
    container.classList.remove('header-collapsed');
  }
}

function toggleMetadata() {
  state.metadataCollapsed = !state.metadataCollapsed;
  saveState();
  applyMetadataState();
  renderAll(); // Need to re-render to resize table widths and column widths
}

function applyMetadataState() {
  const table = document.getElementById('ganttTable');
  const icon = document.getElementById('metadataToggleIcon');
  if (state.metadataCollapsed) {
    table.classList.add('metadata-collapsed');
    if (icon) icon.innerHTML = '<polyline points="9 18 15 12 9 6"></polyline>'; // Point right (expand)
  } else {
    table.classList.remove('metadata-collapsed');
    if (icon) icon.innerHTML = '<polyline points="15 18 9 12 15 6"></polyline>'; // Point left (collapse)
  }
}

function updateTimelineSpan(spanVal) {
  state.timelineSpan = parseInt(spanVal, 10);
  saveState();
  renderAll();
}

// TIMELINE DATE UTILS & CONTROLS
function initDateInputs() {
  document.getElementById('simDateInput').value = state.simulationDate;
}

// Convert date string relative to timeline start
function getTimelineBounds() {
  const startYear = state.startYear;
  const span = state.timelineSpan || 3;
  let startDate, endDate;
  if (state.isAY) {
    startDate = new Date(startYear, 7, 1); // Aug 1
    endDate = new Date(startYear + span, 6, 31); // Jul 31 (span years later)
  } else {
    startDate = new Date(startYear, 0, 1); // Jan 1
    endDate = new Date(startYear + span - 1, 11, 31); // Dec 31
  }
  return { startDate, endDate };
}

// Fractional months position calculator: outputs float from 0 to 36
function getColPosition(dateStr) {
  const bounds = getTimelineBounds();
  const date = new Date(dateStr + 'T00:00:00');
  const start = bounds.startDate;
  
  const yearDiff = date.getFullYear() - start.getFullYear();
  const monthDiff = date.getMonth() - start.getMonth();
  const dayDiff = date.getDate() - 1;
  
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  
  return (yearDiff * 12) + monthDiff + (dayDiff / daysInMonth);
}

// CHECK IF DATE RANGES OVERLAP
function datesOverlap(start1, end1, start2, end2) {
  return new Date(start1 + 'T00:00:00') <= new Date(end2 + 'T00:00:00') && 
         new Date(start2 + 'T00:00:00') <= new Date(end1 + 'T00:00:00');
}

// UPDATE SIMULATION DATE
function updateSimulationDate(dateVal) {
  state.simulationDate = dateVal;
  saveState();
  renderAll();
}

// TOGGLE AY / CY VIEW
function toggleTimelineMode(isAY) {
  state.isAY = isAY;
  document.getElementById('ayToggleBtn').classList.toggle('active', isAY);
  document.getElementById('cyToggleBtn').classList.toggle('active', !isAY);
  saveState();
  renderAll();
}

// SHIFT RANGE VIEW START YEAR
function shiftStartYear(amount) {
  state.startYear += amount;
  saveState();
  renderAll();
}

// RENDER SYSTEM
function renderAll() {
  renderProgramOptions();
  updateTimelineHeaderDisplay();
  renderTimelineHeaders();
  renderPersonnelRoster();
  renderGanttChart();
  calculateMetrics();
}

function renderProgramOptions() {
  // 1. Sidebar filter selector
  const sidebarSelect = document.getElementById('programFilter');
  const sideVal = sidebarSelect.value || 'All';
  sidebarSelect.innerHTML = '<option value="All">All Programs</option>';
  state.programs.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.code;
    opt.textContent = p.name;
    sidebarSelect.appendChild(opt);
  });
  if ([...sidebarSelect.options].some(o => o.value === sideVal)) {
    sidebarSelect.value = sideVal;
  }

  // 2. Billet Form selector
  const formSelect = document.getElementById('billetFormProgram');
  const formVal = formSelect.value || '';
  formSelect.innerHTML = '';
  state.programs.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.code;
    opt.textContent = p.name;
    formSelect.appendChild(opt);
  });
  if (formVal && [...formSelect.options].some(o => o.value === formVal)) {
    formSelect.value = formVal;
  }
}

function updateTimelineHeaderDisplay() {
  const display = document.getElementById('timelineRangeDisplay');
  const start = state.startYear;
  const span = state.timelineSpan || 3;
  if (state.isAY) {
    display.textContent = `AY ${start}/${start+1} - ${start+span-1}/${start+span}`;
  } else {
    display.textContent = `CY ${start} - ${start+span-1}`;
  }
}

// TIMELINE HEADER SUBDIVISIONS DISPLAY
function renderTimelineHeaders() {
  const table = document.getElementById('ganttTable');
  table.innerHTML = '';
  
  const span = state.timelineSpan || 3;
  const totalCols = span * 12;
  const infoColWidth = state.metadataCollapsed ? 120 : 420;
  const colWidth = 35;
  const minTableWidth = infoColWidth + (totalCols * colWidth);
  table.style.minWidth = `${minTableWidth}px`;
  
  // Update global CSS custom property
  table.style.setProperty('--timeline-cols', totalCols);

  const headerRow = document.createElement('div');
  headerRow.className = 'gantt-row gantt-header';
  
  const infoCol = document.createElement('div');
  infoCol.className = 'gantt-info-col';
  
  const chevronIcon = state.metadataCollapsed ? 
    '<polyline points="9 18 15 12 9 6"></polyline>' : 
    '<polyline points="15 18 9 12 15 6"></polyline>';
  
  infoCol.innerHTML = `
    <button class="metadata-toggle-btn" onclick="toggleMetadata()" title="Toggle Metadata Columns" id="metadataToggleBtn">
      <svg id="metadataToggleIcon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        ${chevronIcon}
      </svg>
    </button>
    <div class="gantt-info-grid header-grid">
      <div class="info-cell col-status" title="Status">Stat</div>
      <div class="info-cell col-code" title="Billet Code">Code</div>
      <div class="info-cell col-title" title="Duty Title">Duty Title</div>
      <div class="info-cell col-program" title="Program">Prog</div>
      <div class="info-cell col-type" title="Role & Type">Type</div>
      <div class="info-cell col-rank" title="Required Rank">Rank</div>
    </div>
  `;
  headerRow.appendChild(infoCol);
  
  const trackCol = document.createElement('div');
  trackCol.className = 'gantt-track-col timeline-grid-header';
  
  // Tier 1 Years Row
  const yearsRow = document.createElement('div');
  yearsRow.className = 'timeline-header-row';
  yearsRow.style.display = 'grid';
  yearsRow.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;
  
  for (let i = 0; i < span; i++) {
    const yearVal = state.startYear + i;
    const cell = document.createElement('div');
    cell.className = 'timeline-header-cell year-cell';
    cell.style.gridColumn = 'span 12';
    cell.textContent = state.isAY ? `AY ${yearVal}-${yearVal+1}` : `${yearVal}`;
    yearsRow.appendChild(cell);
  }
  trackCol.appendChild(yearsRow);
  
  // Tier 2 Terms/Months Row
  const subsRow = document.createElement('div');
  subsRow.className = 'timeline-header-row';
  subsRow.style.display = 'grid';
  subsRow.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;
  
  if (state.isAY) {
    for (let i = 0; i < span; i++) {
      const yearVal = state.startYear + i;
      
      const fall = document.createElement('div');
      fall.className = 'timeline-header-cell sub-cell';
      fall.style.gridColumn = 'span 5';
      fall.innerHTML = `<span class="term-name">Fall</span><span class="term-dates">Aug-Dec ${yearVal}</span>`;
      
      const spring = document.createElement('div');
      spring.className = 'timeline-header-cell sub-cell';
      spring.style.gridColumn = 'span 5';
      spring.innerHTML = `<span class="term-name">Spring</span><span class="term-dates">Jan-May ${yearVal+1}</span>`;
      
      const summer = document.createElement('div');
      summer.className = 'timeline-header-cell sub-cell';
      summer.style.gridColumn = 'span 2';
      summer.innerHTML = `<span class="term-name">Summer</span><span class="term-dates">Jun-Jul ${yearVal+1}</span>`;
      
      subsRow.appendChild(fall);
      subsRow.appendChild(spring);
      subsRow.appendChild(summer);
    }
  } else {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < span; i++) {
      for (let m = 0; m < 12; m++) {
        const cell = document.createElement('div');
        cell.className = 'timeline-header-cell sub-cell';
        cell.style.gridColumn = 'span 1';
        cell.textContent = monthNames[m];
        subsRow.appendChild(cell);
      }
    }
  }
  trackCol.appendChild(subsRow);
  headerRow.appendChild(trackCol);
  table.appendChild(headerRow);
}

// RENDER PERSONNEL ROSTER
function renderPersonnelRoster() {
  const list = document.getElementById('personnelRoster');
  list.innerHTML = '';
  
  const sorted = [...state.personnel].sort((a, b) => a.name.localeCompare(b.name));
  
  sorted.forEach(p => {
    const activeAssignment = state.assignments.find(a => 
      a.personnelId === p.id && 
      state.simulationDate >= a.startDate && 
      state.simulationDate <= a.endDate
    );
    
    let assignmentText = 'Unassigned';
    let badgeClass = 'badge-unassigned';
    
    if (activeAssignment) {
      const billet = state.billets.find(b => b.id === activeAssignment.billetId);
      if (billet) {
        assignmentText = billet.code;
        badgeClass = p.type === 'Military' ? 'badge-mil' : 'badge-civ';
      }
    }
    
    const item = document.createElement('div');
    item.className = 'roster-item';
    item.onclick = () => openPersonModal(p.id);
    
    const rankLabel = p.rank || 'No Rank';
    const careerLabel = p.careerField ? ` | ${p.careerField}` : '';
    const tourStart = p.arrival ? formatShortDate(p.arrival) : 'TBD';
    const tourEnd = p.departure ? formatShortDate(p.departure) : 'TBD';
    
    item.innerHTML = `
      <div class="roster-name">
        <span>${p.name}</span>
        <span class="badge ${badgeClass}">${rankLabel}${careerLabel}</span>
      </div>
      <div class="roster-meta">
        <span>${assignmentText}</span>
        <span>Tour: ${tourStart} - ${tourEnd}</span>
      </div>
    `;
    list.appendChild(item);
  });
}

// RENDER GANTT CHART CHANNELS
function renderGanttChart() {
  const table = document.getElementById('ganttTable');
  let simLineLabelRendered = false;
  
  // Keep headers and clear data rows
  const header = table.querySelector('.gantt-header');
  table.innerHTML = '';
  if (header) table.appendChild(header);
  
  const search = document.getElementById('searchFilter').value.toLowerCase();
  const progFilter = document.getElementById('programFilter').value;
  const typeFilter = document.getElementById('typeFilter').value;
  const roleFilter = document.getElementById('roleFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  
  const groups = [];
  state.programs.forEach(p => {
    groups.push({ name: `${p.name} - Military`, program: p.code, type: "Military" });
    groups.push({ name: `${p.name} - Civilian`, program: p.code, type: "Civilian" });
  });
  
  groups.forEach(g => {
    const groupBillets = state.billets.filter(b => {
      if (b.program !== g.program || b.type !== g.type) return false;
      
      if (progFilter !== 'All' && b.program !== progFilter) return false;
      if (typeFilter !== 'All' && b.type !== typeFilter) return false;
      if (roleFilter !== 'All' && b.role !== roleFilter) return false;
      
      const assignments = state.assignments.filter(a => a.billetId === b.id);
      const hasActiveAssignment = assignments.some(a => 
        state.simulationDate >= a.startDate && state.simulationDate <= a.endDate
      );
      
      if (statusFilter === 'Filled' && !hasActiveAssignment) return false;
      if (statusFilter === 'Vacant' && hasActiveAssignment) return false;
      
      const overlaps = getBilletOverlaps(b.id);
      if (statusFilter === 'Overlap' && overlaps.size === 0) return false;
      
      if (search) {
        const codeMatch = b.code.toLowerCase().includes(search);
        const titleMatch = b.title.toLowerCase().includes(search);
        const personnelMatch = assignments.some(a => {
          const p = state.personnel.find(person => person.id === a.personnelId);
          return p && p.name.toLowerCase().includes(search);
        });
        if (!codeMatch && !titleMatch && !personnelMatch) return false;
      }
      return true;
    });
    
    // Auto-sort billets alphabetically by Billet Code within each group
    groupBillets.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
    
    if (groupBillets.length > 0) {
      const groupHeader = document.createElement('div');
      groupHeader.className = 'gantt-row gantt-group-header';
      groupHeader.innerHTML = `
        <div class="gantt-group-header-info">
          <span>${g.name}</span>
          <span class="group-count">${groupBillets.length}</span>
        </div>
        <div class="gantt-track-col" style="min-height: auto; padding: 0;"></div>
      `;
      table.appendChild(groupHeader);
      
      groupBillets.forEach(b => {
        const billetRow = document.createElement('div');
        billetRow.className = 'gantt-row';
        
        const overlaps = getBilletOverlaps(b.id);
        const assignments = state.assignments.filter(a => a.billetId === b.id);
        
        let mismatchCount = 0;
        assignments.forEach(a => {
          const p = state.personnel.find(person => person.id === a.personnelId);
          if (p && (b.type !== p.type || (b.type === 'Military' && b.requiredRank && b.requiredRank !== p.rank))) {
            mismatchCount++;
          }
        });
        
        let statusHTML = '';
        if (overlaps.size > 0) {
          statusHTML = `<span class="badge-status overlap" style="color: var(--danger);" title="Overlap conflict: multiple personnel assigned simultaneously!">&#9888;</span>`;
        } else if (mismatchCount > 0) {
          statusHTML = `<span class="badge-status mismatch" style="color: var(--warning);" title="Rank/Type Mismatch: assigned personnel rank does not match billet requirement.">&#9432;</span>`;
        } else {
          const hasActiveAssignment = assignments.some(a => 
            state.simulationDate >= a.startDate && state.simulationDate <= a.endDate
          );
          if (hasActiveAssignment) {
            statusHTML = `<span class="badge-status filled" style="color: var(--success);" title="Position filled">&#9679;</span>`;
          } else {
            statusHTML = `<span class="badge-status vacant" style="color: var(--text-muted);" title="Position vacant">&#9675;</span>`;
          }
        }
        
        const infoCol = document.createElement('div');
        infoCol.className = 'gantt-info-col';
        infoCol.style.cursor = 'pointer';
        infoCol.onclick = () => openBilletModal(b.id);
        
        const typeShort = b.type === 'Military' ? 'Mil' : 'Civ';
        const roleShort = b.role === 'Faculty' ? 'Fac' : 'Stf';
        const rankClass = b.requiredRank ? '' : 'rank-none';
        const rankLabel = b.requiredRank || 'None';
        const titleLabel = b.title || 'No Title';
        
        infoCol.innerHTML = `
          <div class="gantt-info-grid">
            <div class="info-cell col-status">${statusHTML}</div>
            <div class="info-cell col-code" title="${b.code}">${b.code}</div>
            <div class="info-cell col-title" title="${titleLabel}">${titleLabel}</div>
            <div class="info-cell col-program" title="${b.program}">${b.program}</div>
            <div class="info-cell col-type" title="${b.type} / ${b.role}">${typeShort}/${roleShort}</div>
            <div class="info-cell col-rank ${rankClass}" title="Requires: ${rankLabel}">${rankLabel}</div>
          </div>
        `;
        billetRow.appendChild(infoCol);
        
        // Right Track Columns
        const trackCol = document.createElement('div');
        trackCol.className = 'gantt-track-col';
        
        const span = state.timelineSpan || 3;
        const totalCols = span * 12;

        const gridBg = document.createElement('div');
        gridBg.className = 'gantt-grid-bg';
        gridBg.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;
        for (let m = 0; m < totalCols; m++) {
          const line = document.createElement('div');
          line.className = 'gantt-grid-line';
          if (state.isAY) {
            if (m % 12 === 0) line.classList.add('year-boundary');
            else if (m % 12 === 5 || m % 12 === 10) line.classList.add('term-boundary');
          } else {
            if (m % 12 === 0) line.classList.add('year-boundary');
          }
          gridBg.appendChild(line);
        }
        trackCol.appendChild(gridBg);
        
        const assignmentsContainer = document.createElement('div');
        assignmentsContainer.className = 'gantt-assignments-container';
        
        const lanedAssignments = assignLanes(assignments);
        let maxLane = 0;
        
        lanedAssignments.forEach(la => {
          const block = renderAssignmentBlock(la, overlaps);
          if (block) {
            assignmentsContainer.appendChild(block);
            if (la.lane > maxLane) maxLane = la.lane;
          }
        });
        
        const rowHeight = (maxLane + 1) * 36 + 12;
        billetRow.style.height = `${rowHeight}px`;
        trackCol.appendChild(assignmentsContainer);
        
        const simPos = getColPosition(state.simulationDate);
        if (simPos >= 0 && simPos <= totalCols) {
          const simLine = document.createElement('div');
          simLine.className = 'sim-today-line';
          if (!simLineLabelRendered) {
            simLine.classList.add('show-label');
            
            // Calculate time difference between simulation date and today's actual date
            const simDate = new Date(state.simulationDate + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = simDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            let label = '';
            if (diffDays === 0) {
              label = 'Today';
            } else {
              const diffYears = (diffDays / 365.25).toFixed(1);
              if (diffDays > 0) {
                label = `+${diffYears} yrs`;
              } else {
                label = `${diffYears} yrs`;
              }
            }
            simLine.setAttribute('data-label', label);
            simLineLabelRendered = true;
          }
          simLine.style.left = `${(simPos / totalCols) * 100}%`;
          trackCol.appendChild(simLine);
        }
        
        billetRow.appendChild(trackCol);
        table.appendChild(billetRow);
      });
    }
  });
}

// DRAW ASSIGNMENT ON TIMELINE
function renderAssignmentBlock(la, overlapsSet) {
  const person = state.personnel.find(p => p.id === la.personnelId);
  const billet = state.billets.find(b => b.id === la.billetId);
  if (!person || !billet) return null;
  
  const span = state.timelineSpan || 3;
  const totalCols = span * 12;
  const leftCol = getColPosition(la.startDate);
  const rightCol = getColPosition(la.endDate) + (1 / 30);
  
  if (rightCol <= 0 || leftCol >= totalCols) return null;
  
  const leftPercent = (Math.max(0, leftCol) / totalCols) * 100;
  const rightPercent = (Math.min(totalCols, rightCol) / totalCols) * 100;
  const widthPercent = rightPercent - leftPercent;
  
  const block = document.createElement('div');
  let careerClass = '';
  if (person.careerField === 'Rated') {
    careerClass = ' career-rated';
  } else if (person.careerField === 'Other') {
    careerClass = ' career-other';
  }
  block.className = `assignment-block ${person.type.toLowerCase()}${careerClass}`;
  block.style.left = `${leftPercent}%`;
  block.style.width = `${widthPercent}%`;
  block.style.top = `${la.lane * 36}px`;
  block.style.zIndex = 3;
  
  const isOverlap = overlapsSet.has(la.id);
  const isMismatch = (billet.type !== person.type) || (billet.type === 'Military' && billet.requiredRank && billet.requiredRank !== person.rank);
  
  if (isOverlap) {
    block.classList.add('overlap-warning');
    block.title = "Overlap Conflict!";
  } else if (isMismatch) {
    block.classList.add('rank-mismatch-warning');
    block.title = "Rank/Type Mismatch Warning";
  }
  
  const icon = isOverlap ? '⚠️ ' : (isMismatch ? 'ℹ️ ' : '');
  block.innerHTML = `
    <div class="block-content">
      <span class="block-name">${icon}${person.name} (${person.rank})</span>
      <span class="block-dates">${formatShortDate(la.startDate)} - ${formatShortDate(la.endDate)}</span>
    </div>
  `;
  
  block.onclick = (e) => {
    e.stopPropagation();
    openBilletModal(la.billetId);
  };
  
  return block;
}

// ASSIGN LANES TO PREVENT GANTT COLLISION
function assignLanes(billetAssignments) {
  const sorted = [...billetAssignments].sort((a, b) => new Date(a.startDate + 'T00:00:00') - new Date(b.startDate + 'T00:00:00'));
  const lanes = [];
  
  return sorted.map(a => {
    const start = new Date(a.startDate + 'T00:00:00');
    const end = new Date(a.endDate + 'T00:00:00');
    
    let laneIndex = 0;
    while (laneIndex < lanes.length) {
      if (lanes[laneIndex] < start) {
        break;
      }
      laneIndex++;
    }
    lanes[laneIndex] = end;
    return { ...a, lane: laneIndex };
  });
}

// GET ALL OVERLAPS FOR A BILLET
function getBilletOverlaps(billetId) {
  const billetAssignments = state.assignments.filter(a => a.billetId === billetId);
  const overlapsSet = new Set();
  
  for (let i = 0; i < billetAssignments.length; i++) {
    const a = billetAssignments[i];
    for (let j = i + 1; j < billetAssignments.length; j++) {
      const b = billetAssignments[j];
      if (datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
        overlapsSet.add(a.id);
        overlapsSet.add(b.id);
      }
    }
  }
  return overlapsSet;
}

// KPIs PANEL UPDATER
function calculateMetrics() {
  const totalBillets = state.billets.length;
  if (totalBillets === 0) {
    document.getElementById('metricFillRate').textContent = '0%';
    document.getElementById('metricVacancies').textContent = '0';
    document.getElementById('metricGroupFillRates').innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Empty</div>';
    document.getElementById('metricRosterSummary').innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Empty</div>';
    return;
  }
  
  let filledCount = 0;
  
  state.billets.forEach(b => {
    const assignments = state.assignments.filter(a => a.billetId === b.id);
    const isFilled = assignments.some(a => 
      state.simulationDate >= a.startDate && state.simulationDate <= a.endDate
    );
    if (isFilled) filledCount++;
  });
  
  const fillRate = Math.round((filledCount / totalBillets) * 100);
  const vacancies = totalBillets - filledCount;
  
  document.getElementById('metricFillRate').textContent = `${fillRate}%`;
  document.getElementById('metricVacancies').textContent = vacancies;

  // Group fill rates (Program + Type on simulation date)
  const groupStats = {};
  state.billets.forEach(b => {
    const typeShort = b.type === 'Military' ? 'Mil' : 'Civ';
    const groupKey = `${b.program} ${typeShort}`;
    if (!groupStats[groupKey]) {
      groupStats[groupKey] = { filled: 0, total: 0 };
    }
    groupStats[groupKey].total++;
    
    const assignments = state.assignments.filter(a => a.billetId === b.id);
    const isFilled = assignments.some(a => 
      state.simulationDate >= a.startDate && state.simulationDate <= a.endDate
    );
    if (isFilled) {
      groupStats[groupKey].filled++;
    }
  });
  
  const groupFillContainer = document.getElementById('metricGroupFillRates');
  groupFillContainer.innerHTML = '';
  
  const sortedKeys = Object.keys(groupStats).sort();
  sortedKeys.forEach(key => {
    const stats = groupStats[key];
    const pct = Math.round((stats.filled / stats.total) * 100);
    const item = document.createElement('div');
    item.style.whiteSpace = 'nowrap';
    item.style.overflow = 'hidden';
    item.style.textOverflow = 'ellipsis';
    item.textContent = `${key}: ${pct}% (${stats.filled}/${stats.total})`;
    groupFillContainer.appendChild(item);
  });
  if (sortedKeys.length === 0) {
    groupFillContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Empty</div>';
  }

  // Grouping logic for roster breakdown (active assignments on simulation date)
  const facultyCounts = {};
  let staffCount = 0;
  
  state.assignments.forEach(a => {
    if (state.simulationDate >= a.startDate && state.simulationDate <= a.endDate) {
      const p = state.personnel.find(person => person.id === a.personnelId);
      if (p) {
        if (p.role === 'Faculty') {
          const rank = p.rank || 'No Rank';
          facultyCounts[rank] = (facultyCounts[rank] || 0) + 1;
        } else if (p.role === 'Staff') {
          staffCount++;
        }
      }
    }
  });
  
  const summaryContainer = document.getElementById('metricRosterSummary');
  summaryContainer.innerHTML = '';
  
  const rankOrder = [...MILITARY_RANKS, ...CIVILIAN_RANKS];
  const sortedRanks = Object.keys(facultyCounts).sort((a, b) => {
    const idxA = rankOrder.indexOf(a);
    const idxB = rankOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
  
  sortedRanks.forEach(r => {
    const item = document.createElement('div');
    item.style.whiteSpace = 'nowrap';
    item.style.overflow = 'hidden';
    item.style.textOverflow = 'ellipsis';
    item.textContent = `${r}: ${facultyCounts[r]}`;
    summaryContainer.appendChild(item);
  });
  
  if (staffCount > 0 || sortedRanks.length === 0) {
    const item = document.createElement('div');
    item.style.whiteSpace = 'nowrap';
    item.style.overflow = 'hidden';
    item.style.textOverflow = 'ellipsis';
    item.style.fontWeight = '700';
    item.style.color = 'var(--accent-secondary)';
    item.textContent = `Staff: ${staffCount}`;
    summaryContainer.appendChild(item);
  }
}

// SEARCH FILTER
function triggerFilterRender() {
  renderGanttChart();
}

// MODAL STATE CONTROLLERS
function openModal(id) {
  if (id === 'csvImportModal') {
    document.getElementById('csvImportSummary').style.display = 'none';
    document.getElementById('csvImportSummary').innerHTML = '';
  }
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// OPTION POPULATORS
function adjustBilletRanks(selectedRank = '') {
  const type = document.getElementById('billetFormType').value;
  const rankSelect = document.getElementById('billetFormRank');
  rankSelect.innerHTML = '';
  
  // Add optional "None" option
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = 'None / Vacant';
  if (selectedRank === '') noneOpt.selected = true;
  rankSelect.appendChild(noneOpt);
  
  const list = type === 'Military' ? MILITARY_RANKS : CIVILIAN_RANKS;
  list.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    if (r === selectedRank) opt.selected = true;
    rankSelect.appendChild(opt);
  });
}

function adjustPersonRanks(selectedRank = '') {
  const type = document.getElementById('personFormType').value;
  const rankSelect = document.getElementById('personFormRank');
  rankSelect.innerHTML = '';
  
  // Add optional "None" option
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = 'None';
  if (selectedRank === '') noneOpt.selected = true;
  rankSelect.appendChild(noneOpt);
  
  const list = type === 'Military' ? MILITARY_RANKS : CIVILIAN_RANKS;
  list.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    if (r === selectedRank) opt.selected = true;
    rankSelect.appendChild(opt);
  });
}

// BILLET DIALOG CONTROLS
function openBilletModal(id = null) {
  const form = document.getElementById('billetForm');
  form.reset();
  
  if (id) {
    const billet = state.billets.find(b => b.id === id);
    if (!billet) return;
    
    document.getElementById('billetModalTitle').textContent = 'Edit Billet';
    document.getElementById('billetFormId').value = billet.id;
    document.getElementById('billetFormCode').value = billet.code;
    document.getElementById('billetFormTitle').value = billet.title;
    document.getElementById('billetFormProgram').value = billet.program;
    document.getElementById('billetFormType').value = billet.type;
    document.getElementById('billetFormRole').value = billet.role;
    
    adjustBilletRanks(billet.requiredRank);
    
    document.getElementById('deleteBilletBtn').style.display = 'block';
    document.getElementById('modalAssignmentsSection').style.display = 'block';
    
    renderBilletAssignmentsList(billet);
  } else {
    document.getElementById('billetModalTitle').textContent = 'Add New Billet';
    document.getElementById('billetFormId').value = '';
    adjustBilletRanks();
    
    document.getElementById('deleteBilletBtn').style.display = 'none';
    document.getElementById('modalAssignmentsSection').style.display = 'none';
  }
  openModal('billetModal');
}

function saveBillet(e) {
  e.preventDefault();
  const id = document.getElementById('billetFormId').value;
  const code = document.getElementById('billetFormCode').value;
  const title = document.getElementById('billetFormTitle').value;
  const program = document.getElementById('billetFormProgram').value;
  const type = document.getElementById('billetFormType').value;
  const role = document.getElementById('billetFormRole').value;
  const rank = document.getElementById('billetFormRank').value;
  
  if (id) {
    const idx = state.billets.findIndex(b => b.id === id);
    if (idx !== -1) {
      state.billets[idx] = { id, code, title, program, type, role, requiredRank: rank };
    }
  } else {
    const newId = 'B-' + Date.now();
    state.billets.push({ id: newId, code, title, program, type, role, requiredRank: rank });
  }
  
  saveState();
  closeModal('billetModal');
  renderAll();
}

function deleteBillet() {
  const id = document.getElementById('billetFormId').value;
  if (!id) return;
  
  if (confirm("Are you sure you want to delete this billet? All associated personnel assignments will be permanently deleted.")) {
    state.billets = state.billets.filter(b => b.id !== id);
    state.assignments = state.assignments.filter(a => a.billetId !== id);
    saveState();
    closeModal('billetModal');
    renderAll();
  }
}

// BILLET ASSIGNMENTS LOADER
function renderBilletAssignmentsList(billet) {
  const list = document.getElementById('billetAssignmentList');
  list.innerHTML = '';
  
  const billetAssignments = state.assignments.filter(a => a.billetId === billet.id);
  
  if (billetAssignments.length === 0) {
    list.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); font-style: italic;">No personnel assigned to this position.</div>';
  } else {
    billetAssignments.forEach(a => {
      const person = state.personnel.find(p => p.id === a.personnelId);
      if (!person) return;
      
      const row = document.createElement('div');
      row.className = 'assignment-list-item';
      row.setAttribute('data-assignment-id', a.id);
      
      // view container
      const viewDiv = document.createElement('div');
      viewDiv.style.display = 'flex';
      viewDiv.style.justifyContent = 'space-between';
      viewDiv.style.alignItems = 'center';
      viewDiv.style.width = '100%';
      viewDiv.innerHTML = `
        <div style="cursor: pointer;" onclick="toggleAssignmentEdit('${a.id}', true)">
          <div class="assignment-person-info">${person.name} (${person.rank})</div>
          <div class="assignment-date-info" style="margin-top: 2px;">
            ${formatShortDate(a.startDate)} to ${formatShortDate(a.endDate)} <span style="font-size: 10px; color: var(--accent-primary); margin-left: 6px;">✏️ Edit</span>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="toggleAssignmentEdit('${a.id}', true)">Edit</button>
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="removeAssignment('${a.id}')">Unassign</button>
        </div>
      `;
      
      // edit container
      const editDiv = document.createElement('div');
      editDiv.className = 'assignment-edit-container';
      editDiv.style.display = 'none';
      editDiv.style.width = '100%';
      editDiv.style.flexDirection = 'column';
      editDiv.style.gap = '8px';
      editDiv.style.padding = '8px';
      editDiv.style.backgroundColor = 'var(--bg-main)';
      editDiv.style.borderRadius = 'var(--border-radius-sm)';
      editDiv.style.border = '1px solid var(--border-color)';
      editDiv.style.marginTop = '4px';
      editDiv.innerHTML = `
        <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
          Adjust Tour Dates for ${person.name}
        </div>
        <div style="display: flex; gap: 8px;">
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 9px; text-transform: uppercase; color: var(--text-muted);">Start Date</label>
            <input type="date" id="editAsgStart-${a.id}" class="form-control" style="font-size: 11px; padding: 4px 6px;" value="${a.startDate}">
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 9px; text-transform: uppercase; color: var(--text-muted);">End Date</label>
            <input type="date" id="editAsgEnd-${a.id}" class="form-control" style="font-size: 11px; padding: 4px 6px;" value="${a.endDate}">
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px;">
          <button class="btn btn-secondary" style="padding: 3px 6px; font-size: 10px;" onclick="toggleAssignmentEdit('${a.id}', false)">Cancel</button>
          <button class="btn btn-primary" style="padding: 3px 6px; font-size: 10px;" onclick="saveAssignmentEdit('${a.id}')">Save</button>
        </div>
      `;
      
      row.appendChild(viewDiv);
      row.appendChild(editDiv);
      list.appendChild(row);
    });
  }
  
  const select = document.getElementById('assignPersonSelect');
  select.innerHTML = '<option value="" disabled selected>-- Select a person --</option>';
  
  // Determine assigned status on the simulation date
  const unassigned = [];
  const assigned = [];
  
  state.personnel.forEach(p => {
    const isAssigned = state.assignments.some(a => a.personnelId === p.id);
    if (isAssigned) {
      assigned.push(p);
    } else {
      unassigned.push(p);
    }
  });
  
  unassigned.sort((a, b) => a.name.localeCompare(b.name));
  assigned.sort((a, b) => a.name.localeCompare(b.name));
  
  if (unassigned.length > 0) {
    const group = document.createElement('optgroup');
    group.label = 'Unassigned Personnel';
    unassigned.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      const rankText = p.rank ? ` (${p.rank})` : '';
      opt.textContent = `${p.name}${rankText}`;
      group.appendChild(opt);
    });
    select.appendChild(group);
  }
  
  if (assigned.length > 0) {
    const group = document.createElement('optgroup');
    group.label = 'Assigned Personnel';
    assigned.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      const rankText = p.rank ? ` (${p.rank})` : '';
      const activeAsg = state.assignments.find(a => 
        a.personnelId === p.id && 
        state.simulationDate >= a.startDate && 
        state.simulationDate <= a.endDate
      );
      const billetInfo = activeAsg ? ` [Active: ${state.billets.find(b => b.id === activeAsg.billetId)?.code || ''}]` : '';
      opt.textContent = `${p.name}${rankText}${billetInfo}`;
      group.appendChild(opt);
    });
    select.appendChild(group);
  }
}

function addAssignment(e) {
  e.preventDefault();
  const billetId = document.getElementById('billetFormId').value;
  const personnelId = document.getElementById('assignPersonSelect').value;
  const startDate = document.getElementById('assignStartDate').value;
  const endDate = document.getElementById('assignEndDate').value;
  
  if (!billetId || !personnelId || !startDate || !endDate) return;
  
  if (new Date(startDate) > new Date(endDate)) {
    alert("Error: Start date cannot be after the End date.");
    return;
  }
  
  const person = state.personnel.find(p => p.id === personnelId);
  const billet = state.billets.find(b => b.id === billetId);
  
  if (person) {
    if (new Date(startDate) < new Date(person.arrival) || new Date(endDate) > new Date(person.departure)) {
      if (!confirm(`Warning: The assignment date range (${startDate} to ${endDate}) lies outside of ${person.name}'s estimated tour dates (${person.arrival} to ${person.departure}). Proceed anyway?`)) {
        return;
      }
    }
  }
  
  if (billet && person) {
    if (billet.type !== person.type) {
      if (!confirm(`Warning: You are assigning a ${person.type} person to a ${billet.type} billet. Proceed?`)) {
        return;
      }
    } else if (billet.type === 'Military' && billet.requiredRank && billet.requiredRank !== person.rank) {
      if (!confirm(`Warning: Rank mismatch. Billet requires ${billet.requiredRank}, but assigned person is ${person.rank}. Proceed?`)) {
        return;
      }
    }
  }
  
  const newId = 'A-' + Date.now();
  state.assignments.push({ id: newId, billetId, personnelId, startDate, endDate });
  saveState();
  
  document.getElementById('assignPersonSelect').value = '';
  document.getElementById('assignStartDate').value = '';
  document.getElementById('assignEndDate').value = '';
  
  renderBilletAssignmentsList({ id: billetId });
  renderAll();
}

function removeAssignment(id) {
  if (confirm("Are you sure you want to remove this assignment?")) {
    const billetId = document.getElementById('billetFormId').value;
    state.assignments = state.assignments.filter(a => a.id !== id);
    saveState();
    renderBilletAssignmentsList({ id: billetId });
    renderAll();
  }
}

function toggleAssignmentEdit(id, show) {
  const row = document.querySelector(`.assignment-list-item[data-assignment-id="${id}"]`);
  if (row) {
    const view = row.children[0];
    const edit = row.children[1];
    if (show) {
      view.style.display = 'none';
      edit.style.display = 'flex';
    } else {
      view.style.display = 'flex';
      edit.style.display = 'none';
    }
  }
}

function saveAssignmentEdit(id) {
  const startInput = document.getElementById(`editAsgStart-${id}`);
  const endInput = document.getElementById(`editAsgEnd-${id}`);
  if (!startInput || !endInput) return;
  
  const startDate = startInput.value;
  const endDate = endInput.value;
  
  if (!startDate || !endDate) {
    alert("Error: Start and End dates are required.");
    return;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    alert("Error: Start date cannot be after the End date.");
    return;
  }
  
  const asg = state.assignments.find(a => a.id === id);
  if (!asg) return;
  
  const person = state.personnel.find(p => p.id === asg.personnelId);
  if (person) {
    if (new Date(startDate) < new Date(person.arrival) || new Date(endDate) > new Date(person.departure)) {
      if (!confirm(`Warning: The assignment date range (${startDate} to ${endDate}) lies outside of ${person.name}'s estimated tour dates (${person.arrival} to ${person.departure}). Proceed anyway?`)) {
        return;
      }
    }
  }
  
  asg.startDate = startDate;
  asg.endDate = endDate;
  
  saveState();
  
  const billetId = document.getElementById('billetFormId').value;
  renderBilletAssignmentsList({ id: billetId });
  renderAll();
}

// PERSONNEL RECORDS DIALOG CONTROLS
function openPersonModal(id = null) {
  const form = document.getElementById('personForm');
  form.reset();
  
  if (id) {
    const p = state.personnel.find(pers => pers.id === id);
    if (!p) return;
    
    document.getElementById('personModalTitle').textContent = 'Edit Personnel Record';
    document.getElementById('personFormId').value = p.id;
    document.getElementById('personFormName').value = p.name;
    document.getElementById('personFormType').value = p.type;
    document.getElementById('personFormRole').value = p.role;
    document.getElementById('personFormCareerField').value = p.careerField || '';
    document.getElementById('personFormArrival').value = p.arrival;
    document.getElementById('personFormDeparture').value = p.departure;
    
    adjustPersonRanks(p.rank);
    
    document.getElementById('deletePersonBtn').style.display = 'block';
  } else {
    document.getElementById('personModalTitle').textContent = 'Add New Personnel Record';
    document.getElementById('personFormId').value = '';
    document.getElementById('personFormCareerField').value = '';
    adjustPersonRanks();
    
    document.getElementById('deletePersonBtn').style.display = 'none';
  }
  openModal('personModal');
}

function savePerson(e) {
  e.preventDefault();
  const id = document.getElementById('personFormId').value;
  const name = document.getElementById('personFormName').value;
  const type = document.getElementById('personFormType').value;
  const rank = document.getElementById('personFormRank').value;
  const role = document.getElementById('personFormRole').value;
  const careerField = document.getElementById('personFormCareerField').value;
  const arrival = document.getElementById('personFormArrival').value;
  const departure = document.getElementById('personFormDeparture').value;
  
  if (arrival && departure && new Date(arrival) > new Date(departure)) {
    alert("Error: Estimated arrival date cannot be after departure date.");
    return;
  }
  
  if (id) {
    const idx = state.personnel.findIndex(p => p.id === id);
    if (idx !== -1) {
      state.personnel[idx] = { id, name, rank, type, role, arrival, departure, careerField };
    }
  } else {
    const newId = 'P-' + Date.now();
    state.personnel.push({ id: newId, name, rank, type, role, arrival, departure, careerField });
  }
  
  saveState();
  closeModal('personModal');
  renderAll();
}

function deletePerson() {
  const id = document.getElementById('personFormId').value;
  if (!id) return;
  
  if (confirm("Are you sure you want to delete this person? This will also remove any assignments mapped to this individual.")) {
    state.personnel = state.personnel.filter(p => p.id !== id);
    state.assignments = state.assignments.filter(a => a.personnelId !== id);
    saveState();
    closeModal('personModal');
    renderAll();
  }
}

// HELPER: DATE FORMATTER
function formatShortDate(dateStr) {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear().toString().substring(2);
  return `${month} '${year}`;
}

// ---- MAINTENANCE UPGRADES ----
const CURRENT_VERSION = 1;

function generateId(prefix){
  return prefix + '-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.floor(Math.random()*10000));
}

function safeDate(dateStr){
  if(!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function validateState(){
  let errors = [];
  (state.assignments||[]).forEach(a=>{
    if(!state.personnel.find(p=>p.id===a.personnelId)){
      errors.push('Invalid personnel reference: '+a.id);
    }
    if(!state.billets.find(b=>b.id===a.billetId)){
      errors.push('Invalid billet reference: '+a.id);
    }
  });
  if(errors.length>0){
    console.warn('Data validation issues:', errors);
  }
}

window.debugState = ()=>console.log(state);

// Patch saveState to include version
const originalSaveState = saveState;
saveState = function(){
  state.version = CURRENT_VERSION;
  localStorage.setItem('manning_tool_state', JSON.stringify(state));
}

// Patch loadState post-processing for version
const originalLoadState = loadState;
loadState = function(){
  originalLoadState();
  if(!state.version){
    state.version = CURRENT_VERSION;
  }
}

// Hook validation into render cycle
const originalRenderAll = renderAll;
renderAll = function(){
  validateState();
  originalRenderAll();
}
// ---- END MAINTENANCE UPGRADES ----
