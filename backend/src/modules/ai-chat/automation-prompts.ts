export function getUrlContext(url: string): {
  workspace: string | null;
  project: string | null;
  page:
    | 'global-tasks'
    | 'workspace-tasks'
    | 'project-tasks'
    | 'task-new-ws'
    | 'task-new-proj'
    | 'task-detail'
    | 'other';
} {
  const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
  const parts = path.split('/').filter(Boolean);

  // /{ws}/{proj}/tasks/{taskSlug}
  if (parts.length >= 4 && parts[2] === 'tasks' && parts[3] !== 'new') {
    return { workspace: parts[0], project: parts[1], page: 'task-detail' };
  }
  // /{ws}/{proj}/tasks/new
  if (parts.length >= 4 && parts[2] === 'tasks' && parts[3] === 'new') {
    return { workspace: parts[0], project: parts[1], page: 'task-new-proj' };
  }
  // /{ws}/{proj}/tasks
  if (parts.length === 3 && parts[2] === 'tasks') {
    return { workspace: parts[0], project: parts[1], page: 'project-tasks' };
  }
  // /{ws}/tasks/new
  if (parts.length === 3 && parts[1] === 'tasks' && parts[2] === 'new') {
    return { workspace: parts[0], project: null, page: 'task-new-ws' };
  }
  // /{ws}/tasks
  if (parts.length === 2 && parts[1] === 'tasks') {
    return { workspace: parts[0], project: null, page: 'workspace-tasks' };
  }
  // /tasks
  if (parts.length === 1 && parts[0] === 'tasks') {
    return { workspace: null, project: null, page: 'global-tasks' };
  }
  return { workspace: null, project: null, page: 'other' };
}

//  1. CREATE TASK
export const CREATE_TASK_PROMPT = `
TASK CREATION — STEP-BY-STEP RULES:

BEFORE you take ANY action, check if you have all required info:
  Required: task title, workspace, project
  Optional (skip unless user asked): priority, status, description, due date, assignees

HOW TO DETERMINE WORKSPACE & PROJECT:
  1. Check the current URL:
     - /{ws}/{proj}/tasks or /{ws}/{proj}/tasks/new → BOTH workspace and project are known from URL
     - /{ws}/tasks or /{ws}/tasks/new → Workspace is known, project is NOT
     - /tasks → NEITHER is known
  2. Check if the user mentioned workspace/project in their message or in any PREVIOUS message in the conversation
  3. If you STILL don't know workspace or project → ASK: "Which workspace and project should I create this task in?"
  4. If you know workspace but NOT project → ASK: "Which project should I create this task in?"
  5. If the user already answered in a previous message → USE that answer. Do NOT ask again.
  6. NEVER guess or pick randomly.

PAGE-SPECIFIC INSTRUCTIONS:

ON /{ws}/{proj}/tasks PAGE (project task list):
  - Use the inline "Add Task" row at the top of the table
  - Step 1: Click the "Add Task" button/row to expand the inline form
  - Step 2: Type the task title in the inline title input
  - Step 3: Project and status are already set — do NOT change them
  - Step 4: Press Enter or click the ✓ button to create

ON /{ws}/tasks PAGE (workspace task list):
  - Use the inline "Add Task" row at the top of the table
  - Step 1: Click the "Add Task" button/row to expand the inline form
  - Step 2: Type the task title in the inline title input
  - Step 3: Select the project from the Project dropdown — use the user's specified project
  - Step 4: WAIT — status auto-fills after project selection. If status is empty, task will FAIL
  - Step 5: Press Enter or click the ✓ button to create

ON /{ws}/{proj}/tasks/new PAGE (full task creation form):
  - Workspace and project are ALREADY pre-filled (read-only)
  - Step 1: Type the task title in the title input field
  - Step 2: Click the "Create Task" button (data-automation-id="create-task-submit")
  - Do NOT touch priority, status, or other optional fields unless user asked
  - The task does NOT exist until you click "Create Task". Do NOT say DONE before clicking it.

ON /{ws}/tasks/new PAGE:
  - Workspace is pre-filled. Project must be selected.
  - Step 1: Type the task title in the title input
  - Step 2: Select the project from dropdown (data-automation-id="task-project-select")
  - Step 3: Click "Create Task" button (data-automation-id="create-task-submit")
  - The task does NOT exist until you click "Create Task". Do NOT say DONE before clicking it.

ON /tasks PAGE (global tasks):
  - Step 1: Click "Create Task" button to open the modal
  - Step 2: Type the task title
  - Step 3: Click workspace dropdown (data-automation-id="select-workspace"), type to search, select match
  - Step 4: Click project dropdown (data-automation-id="select-project"), type to search, select match
  - Step 5: Click "Create Task" (data-automation-id="create-task-submit")
  - CRITICAL: Type in the search inputs to find the correct workspace/project. Do NOT click first item blindly.

CRITICAL: Filling form fields does NOT create a task. You MUST click the submit button. Do NOT say DONE before clicking it.
`;

//  2. FILTER TASKS
export const FILTER_TASK_PROMPT = `
TASK FILTERING — STEP-BY-STEP RULES:

Filters use CHECKBOXES that TOGGLE on/off. The filter dropdown is at id="filter-dropdown-trigger".

Step 1: Click the filter dropdown trigger button (id="filter-dropdown-trigger")
Step 2: Expand the relevant filter section (click the section header like "Priority", "Status", etc.)
Step 3: LOOK at ALL checkboxes in that section:
  - Checked: aria-checked="true" or data-state="checked"
  - Unchecked: aria-checked="false" or data-state="unchecked"
Step 4: The goal is to have ONLY the requested value's checkbox checked:
  - FIRST: Click every checkbox that IS checked but is NOT the requested value (to uncheck them)
  - THEN: If the requested value's checkbox is NOT already checked, click it (to check it)
Step 5: If the requested value is already the ONLY checked item → say DONE immediately
Step 6: Do ONE click per action. After each click, re-examine the checkboxes on the next iteration.

IMPORTANT:
- Empty results or zero items does NOT mean failure. The filter was applied correctly.
- Do NOT retry or change anything just because results look empty.
- This applies to ALL filter types: priority, status, type, assignee, reporter, etc.
`;

//  3. UPDATE TASK
export const UPDATE_TASK_PROMPT = `
TASK UPDATE — STEP-BY-STEP RULES:

Step 1: Find and click the task row in the task table to open the task detail modal
Step 2: In the detail modal, find the field to update:
  - Priority: Click the priority badge (data-testid="priority-badge") or the "Edit" button (data-testid="edit-priority-btn"), then click the new value
  - Status: Click the status badge (data-testid="status-badge") or the "Edit" button (data-testid="edit-status-btn"), then click the new value
  - Sprint: Click the sprint badge (data-testid="sprint-badge") or the "Edit" button (data-testid="edit-sprint-btn"), then click the new value
  - Type: Click the type badge (data-testid="task-type-badge") or the "Edit" button (data-testid="edit-task-type-btn"), then click the new value
  - Title/Description: Click the edit button (data-testid="edit-title-description-btn"), edit fields, click "Save Changes"
  - Dates: Click the "Edit" button (data-testid="edit-dates-btn"), change dates, then save by clicking elsewhere

Step 3: After clicking the dropdown option, the update is saved automatically. Say DONE immediately.

CRITICAL RULES:
- After clicking a dropdown option, the update saves auto. Say DONE right away.
- Do NOT click outside the modal to close it — the app handles modal closure.
- Do NOT try to close the modal manually.
- Do NOT repeat clicks.
- If you don't see the task in the list, scroll down to find it.
`;

//  4. DELETE TASK
export const DELETE_TASK_PROMPT = `
TASK DELETION — STEP-BY-STEP RULES:

Step 1: Find and click the task row in the task table to open the task detail modal
Step 2: Click the delete button (id="delete-task-button") — it has a red trash icon in the top-right area
Step 3: A confirmation dialog will appear. Click the "Delete" / confirm button to confirm deletion.
Step 4: Say DONE after the confirmation dialog is dismissed.

CRITICAL:
- The delete button shows a confirmation dialog. You MUST click confirm to actually delete.
- Do NOT say DONE before clicking confirm in the dialog.
- If you don't see the task, scroll down in the task list to find it.
`;

//  5. GENERAL ERROR HANDLING
export const ERROR_HANDLING_PROMPT = `
ERROR HANDLING RULES:
- If an action fails (element not found, click didn't work), try a DIFFERENT element or approach. Do NOT repeat the failed action.
- If you cannot find the requested task/element after scrolling the page, say ASK: "I couldn't find [task name] on this page. Could you confirm the exact name?"
- Rate limit or API errors are not your fault — say DONE: "Rate limit reached, please try again in a moment."
- If context is too long, say DONE: "The conversation is too long. Please clear the chat and try again."
- NEVER show raw error messages like "Element with index 34 not found" to the user.
`;

//  PROMPT SELECTOR — picks the right prompt based on user intent
export function getAutomationPrompt(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  let prompt = '';

  // Detect intent
  if (msg.includes('delete') && msg.includes('task')) {
    prompt = DELETE_TASK_PROMPT;
  } else if (
    (msg.includes('update') ||
      msg.includes('change') ||
      msg.includes('set') ||
      msg.includes('mark') ||
      msg.includes('assign') ||
      msg.includes('move')) &&
    msg.includes('task')
  ) {
    prompt = UPDATE_TASK_PROMPT;
  } else if (
    (msg.includes('filter') ||
      msg.includes('show') ||
      msg.includes('display') ||
      msg.includes('list')) &&
    (msg.includes('priority') ||
      msg.includes('status') ||
      msg.includes('high') ||
      msg.includes('low') ||
      msg.includes('medium') ||
      msg.includes('done') ||
      msg.includes('todo') ||
      msg.includes('in progress'))
  ) {
    prompt = FILTER_TASK_PROMPT;
  } else if (
    (msg.includes('create') ||
      msg.includes('add') ||
      msg.includes('make') ||
      msg.includes('new')) &&
    msg.includes('task')
  ) {
    prompt = CREATE_TASK_PROMPT;
  }

  // Always append error handling
  if (prompt) {
    prompt += '\n' + ERROR_HANDLING_PROMPT;
  }

  return prompt;
}
