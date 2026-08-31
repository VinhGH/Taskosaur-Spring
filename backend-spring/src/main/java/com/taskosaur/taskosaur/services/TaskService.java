package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.task.*;
import com.taskosaur.taskosaur.enums.StatusCategory;
import com.taskosaur.taskosaur.enums.TaskPriority;
import com.taskosaur.taskosaur.enums.TaskType;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.*;
import com.taskosaur.taskosaur.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TaskService {

    public static final String GROUP_BY_STATUS = "status";
    private static final String KEY_TASKS = "tasks";
    private static final String KEY_TOTAL = "total";
    private static final String KEY_RECURRING_TASK_ID = "recurringTaskId";
    private static final String KEY_IS_RECURRING = "isRecurring";
    private static final String KEY_FAILED_TASKS = "failedTasks";
    private static final String KEY_REASON = "reason";
    private static final String DEFAULT_UNKNOWN_ERROR = "Unknown error";
    private static final String TASK_NOT_FOUND_MSG = "Task not found with id: ";
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );

    private final TaskRepository taskRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final UserRepository userRepository;

    @org.springframework.cache.annotation.CacheEvict(value = {"org_analytics", "project_charts"}, allEntries = true)
    public TaskResponse createTask(CreateTaskRequest request, String userId) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        String statusId = resolveInitialStatusId(request.getStatusId(), project.getWorkflowId());
        int nextTaskNumber = taskRepository.findMaxTaskNumberByProjectId(project.getId()) + 1;
        String slug = buildTaskSlug(project.getTaskPrefix(), nextTaskNumber);

        Task task = Task.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : TaskType.TASK)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .taskNumber(nextTaskNumber)
                .slug(slug)
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .storyPoints(request.getStoryPoints())
                .projectId(project.getId())
                .statusId(statusId)
                .sprintId(request.getSprintId())
                .parentTaskId(request.getParentTaskId())
                .createdBy(userId)
                .build();

        Task savedTask = taskRepository.save(task);
        saveTaskAssignees(savedTask.getId(), request.getAssigneeIds());

        return buildTaskResponse(savedTask);
    }

    private String resolveInitialStatusId(String requestedStatusId, String workflowId) {
        if (requestedStatusId != null && !requestedStatusId.isBlank()) {
            return requestedStatusId;
        }
        return taskStatusRepository.findByWorkflowIdAndIsDefaultTrue(workflowId)
                .map(TaskStatus::getId)
                .orElseGet(() -> {
                    List<TaskStatus> statuses = taskStatusRepository.findByWorkflowIdOrderByPositionAsc(workflowId);
                    if (statuses.isEmpty()) {
                        throw new ResourceNotFoundException("No task status found for project workflow");
                    }
                    return statuses.get(0).getId();
                });
    }

    private String buildTaskSlug(String taskPrefix, int taskNumber) {
        String prefix = (taskPrefix != null && !taskPrefix.isBlank()) ? taskPrefix : "TASK";
        return prefix + "-" + taskNumber;
    }

    @org.springframework.cache.annotation.CacheEvict(value = {"org_analytics", "project_charts"}, allEntries = true)
    public TaskResponse updateTask(String id, UpdateTaskRequest request, String userId) {
        Task task = findTaskOrThrow(id);
        applyTaskFieldUpdates(task, request);
        task.setUpdatedBy(userId);

        Task savedTask = taskRepository.save(task);
        if (request.getAssigneeIds() != null) {
            updateAssignees(savedTask.getId(), request.getAssigneeIds());
        }

        return buildTaskResponse(savedTask);
    }

    private void applyTaskFieldUpdates(Task task, UpdateTaskRequest request) {
        applyBasicFields(task, request);
        applyScheduleFields(task, request);
        applyRelationshipFields(task, request);
    }

    private void applyBasicFields(Task task, UpdateTaskRequest request) {
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            task.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getType() != null) {
            task.setType(request.getType());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
    }

    private void applyScheduleFields(Task task, UpdateTaskRequest request) {
        if (request.getStartDate() != null) {
            task.setStartDate(request.getStartDate());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getStoryPoints() != null) {
            task.setStoryPoints(request.getStoryPoints());
        }
    }

    private void applyRelationshipFields(Task task, UpdateTaskRequest request) {
        if (request.getSprintId() != null) {
            task.setSprintId(request.getSprintId().isBlank() ? null : request.getSprintId());
        }
        if (request.getParentTaskId() != null) {
            task.setParentTaskId(request.getParentTaskId().isBlank() ? null : request.getParentTaskId());
        }
        if (request.getStatusId() != null && !request.getStatusId().isBlank()) {
            updateStatusField(task, request.getStatusId());
        }
    }

    private void updateStatusField(Task task, String statusId) {
        task.setStatusId(statusId);
        taskStatusRepository.findById(statusId).ifPresent(status ->
            task.setCompletedAt(status.getCategory() == StatusCategory.DONE ? LocalDateTime.now(ZoneOffset.UTC) : null)
        );
    }

    private void updateAssignees(String taskId, List<String> assigneeIds) {
        taskAssigneeRepository.deleteByTaskId(taskId);
        saveTaskAssignees(taskId, assigneeIds);
    }

    private void saveTaskAssignees(String taskId, List<String> assigneeIds) {
        if (assigneeIds == null || assigneeIds.isEmpty()) return;
        List<TaskAssignee> assignees = assigneeIds.stream()
                .map(userId -> TaskAssignee.builder()
                        .taskId(taskId)
                        .userId(userId)
                        .build())
                .toList();
        taskAssigneeRepository.saveAll(assignees);
    }

    public Map<String, Object> getFilteredTasks(TaskFilterQuery query) {
        List<Task> matchingTasks = fetchMatchingTasks(query);
        matchingTasks.sort(getTaskComparator(query.sortBy(), query.sortOrder()));

        int total = matchingTasks.size();
        int safeLimit = Math.max(1, query.limit());
        int totalPages = (int) Math.ceil((double) total / safeLimit);
        int safePage = Math.clamp(query.page(), 1, Math.max(1, totalPages));

        int fromIndex = (safePage - 1) * safeLimit;
        List<Task> pageTasks = fromIndex < total
                ? matchingTasks.subList(fromIndex, Math.min(fromIndex + safeLimit, total))
                : List.of();

        List<TaskResponse> data = pageTasks.stream()
                .map(this::buildTaskResponse)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("data", data);
        result.put(KEY_TOTAL, total);
        result.put("page", safePage);
        result.put("limit", safeLimit);
        result.put("totalPages", totalPages);
        return result;
    }

    public Map<String, Object> getTasksGroupedByStatus(
            String slug,
            String projectId,
            String statusId,
            String sprintId,
            Boolean includeSubtasks,
            int page,
            int limit
    ) {
        Project project = resolveProject(slug, projectId);
        if (project == null) {
            return Map.of("data", List.of(), "meta", Map.of("totalTasks", 0, "loadedTasks", 0, "totalStatuses", 0));
        }

        List<TaskStatus> workflowStatuses = resolveWorkflowStatuses(project.getWorkflowId(), statusId);
        List<Task> tasks = filterTasksForStatusGroup(taskRepository.findByProjectId(project.getId()), sprintId, includeSubtasks);

        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, limit);

        List<Map<String, Object>> dataList = workflowStatuses.stream()
                .map(status -> buildStatusGroupItem(status, tasks, safePage, safeLimit))
                .toList();

        long totalTasksCount = dataList.stream()
                .mapToLong(item -> ((Number) ((Map<?, ?>) item.get("pagination")).get(KEY_TOTAL)).longValue())
                .sum();
        long loadedTasksCount = dataList.stream()
                .mapToLong(item -> ((List<?>) item.get(KEY_TASKS)).size())
                .sum();

        Map<String, Object> result = new HashMap<>();
        result.put("data", dataList);
        result.put("meta", Map.of(
                "totalTasks", totalTasksCount,
                "loadedTasks", loadedTasksCount,
                "totalStatuses", dataList.size(),
                "fetchedAt", LocalDateTime.now(ZoneOffset.UTC).toString()
        ));
        return result;
    }

    private Project resolveProject(String slug, String projectId) {
        if (slug != null && !slug.isBlank()) {
            return projectRepository.findBySlug(slug).orElse(null);
        }
        if (projectId != null && !projectId.isBlank()) {
            return projectRepository.findById(projectId).orElse(null);
        }
        return null;
    }

    private List<TaskStatus> resolveWorkflowStatuses(String workflowId, String statusId) {
        List<TaskStatus> statuses = workflowId != null
                ? taskStatusRepository.findByWorkflowIdOrderByPositionAsc(workflowId)
                : taskStatusRepository.findAll();

        if (statusId != null && !statusId.isBlank()) {
            return statuses.stream().filter(s -> s.getId().equals(statusId)).toList();
        }
        return statuses;
    }

    private List<Task> filterTasksForStatusGroup(List<Task> allTasks, String sprintId, Boolean includeSubtasks) {
        List<Task> tasks = new ArrayList<>(allTasks);
        if (sprintId != null && !sprintId.isBlank()) {
            Set<String> sprintSet = parseCommaSeparatedSet(sprintId);
            boolean includeBacklog = sprintSet.contains("null") || sprintSet.contains("backlog") || sprintSet.contains("none");
            tasks.removeIf(t -> t.getSprintId() == null ? !includeBacklog : !sprintSet.contains(t.getSprintId()));
        }
        if (Boolean.FALSE.equals(includeSubtasks)) {
            tasks.removeIf(t -> t.getParentTaskId() != null && !t.getParentTaskId().isBlank());
        }
        return tasks;
    }

    private Map<String, Object> buildStatusGroupItem(TaskStatus status, List<Task> allTasks, int page, int limit) {
        List<Task> statusTasks = allTasks.stream()
                .filter(t -> Objects.equals(t.getStatusId(), status.getId()))
                .sorted(Comparator.comparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        int total = statusTasks.size();
        int totalPages = (int) Math.ceil((double) total / limit);
        int fromIndex = (page - 1) * limit;
        List<Task> pageTasks = fromIndex < total
                ? statusTasks.subList(fromIndex, Math.min(fromIndex + limit, total))
                : List.of();

        Map<String, Object> statusObj = new HashMap<>();
        statusObj.put("statusId", status.getId());
        statusObj.put("statusName", status.getName());
        statusObj.put("statusColor", status.getColor() != null ? status.getColor() : "#6b7280");
        statusObj.put("statusCategory", status.getCategory() != null ? status.getCategory().name() : "TODO");
        statusObj.put("statusPosition", status.getPosition() != null ? status.getPosition() : 0);
        statusObj.put(GROUP_BY_STATUS, Map.of(
                "id", status.getId(),
                "name", status.getName(),
                "color", status.getColor() != null ? status.getColor() : "#6b7280",
                "category", status.getCategory() != null ? status.getCategory().name() : "TODO",
                "position", status.getPosition() != null ? status.getPosition() : 0
        ));
        statusObj.put(KEY_TASKS, pageTasks.stream().map(this::buildTaskResponse).toList());
        statusObj.put("pagination", Map.of(
                "page", page,
                "limit", limit,
                KEY_TOTAL, total,
                "totalPages", totalPages,
                "hasNextPage", page < totalPages,
                "hasPreviousPage", page > 1
        ));
        return statusObj;
    }

    public Map<String, Object> getGroupedTasks(TaskGroupQuery groupQuery) {
        TaskFilterQuery filterQuery = TaskFilterQuery.builder()
                .organizationId(groupQuery.organizationId())
                .workspaceId(groupQuery.workspaceId())
                .projectId(groupQuery.projectId())
                .sprintId(groupQuery.sprintId())
                .priorities(groupQuery.priorities())
                .statuses(groupQuery.statuses())
                .types(groupQuery.types())
                .search(groupQuery.search())
                .page(1)
                .limit(1000)
                .build();

        List<Task> tasks = fetchMatchingTasks(filterQuery);
        String effectiveGroupBy = (groupQuery.groupBy() != null && !groupQuery.groupBy().isBlank())
                ? groupQuery.groupBy()
                : GROUP_BY_STATUS;

        Map<String, List<Task>> groupedMap = groupTasksByField(tasks, effectiveGroupBy);
        int safeLimit = groupQuery.limitPerGroup() > 0 ? groupQuery.limitPerGroup() : 20;

        List<Map<String, Object>> groups = groupedMap.entrySet().stream()
                .map(entry -> buildGroupResponse(entry.getKey(), entry.getValue(), effectiveGroupBy, safeLimit))
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("groups", groups);
        result.put("groupBy", effectiveGroupBy);
        result.put("page", groupQuery.page());
        result.put("limitPerGroup", safeLimit);
        return result;
    }

    private Map<String, List<Task>> groupTasksByField(List<Task> tasks, String groupBy) {
        Map<String, List<Task>> map = new LinkedHashMap<>();
        for (Task t : tasks) {
            String key = resolveGroupKey(t, groupBy);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(t);
        }
        return map;
    }

    private String resolveGroupKey(Task t, String groupBy) {
        String field = groupBy != null ? groupBy.toLowerCase() : GROUP_BY_STATUS;
        return switch (field) {
            case "priority" -> t.getPriority() != null ? t.getPriority().name() : "NONE";
            case "type" -> t.getType() != null ? t.getType().name() : "TASK";
            case "project" -> t.getProjectId() != null ? t.getProjectId() : "NONE";
            default -> t.getStatusId() != null ? t.getStatusId() : "NONE";
        };
    }

    private Map<String, Object> buildGroupResponse(String key, List<Task> groupTasks, String groupBy, int safeLimit) {
        int totalCount = groupTasks.size();
        List<TaskResponse> responseList = groupTasks.stream()
                .limit(safeLimit)
                .map(this::buildTaskResponse)
                .toList();

        String label = key;
        if (GROUP_BY_STATUS.equalsIgnoreCase(groupBy)) {
            TaskStatus st = taskStatusRepository.findById(key).orElse(null);
            if (st != null) label = st.getName();
        }

        Map<String, Object> groupObj = new HashMap<>();
        groupObj.put("key", key);
        groupObj.put("label", label);
        groupObj.put("totalCount", totalCount);
        groupObj.put(KEY_TASKS, responseList);
        groupObj.put("page", 1);
        return groupObj;
    }

    private Comparator<Task> getTaskComparator(String sortBy, String sortOrder) {
        String sortKey = sortBy != null ? sortBy.toLowerCase() : "";
        Comparator<Task> comparator = switch (sortKey) {
            case "title" -> Comparator.comparing(Task::getTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "duedate" -> Comparator.comparing(Task::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()));
            case "tasknumber" -> Comparator.comparing(Task::getTaskNumber, Comparator.nullsLast(Comparator.naturalOrder()));
            default -> Comparator.comparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
        };
        return "desc".equalsIgnoreCase(sortOrder) ? comparator.reversed() : comparator;
    }

    private List<Task> fetchMatchingTasks(TaskFilterQuery query) {
        List<Task> tasks = fetchInitialTasks(query.organizationId(), query.workspaceId(), query.projectId());
        applyFilters(tasks, query);
        return tasks;
    }

    private List<Task> fetchInitialTasks(String organizationId, String workspaceId, String projectId) {
        if (projectId != null && !projectId.isBlank()) {
            return new ArrayList<>(taskRepository.findByProjectId(projectId));
        }
        if (workspaceId != null && !workspaceId.isBlank()) {
            List<String> projectIds = projectRepository.findByWorkspaceId(workspaceId).stream()
                    .map(Project::getId)
                    .toList();
            return projectIds.isEmpty() ? new ArrayList<>() : new ArrayList<>(taskRepository.findByProjectIdIn(projectIds));
        }
        if (organizationId != null && !organizationId.isBlank()) {
            List<String> workspaceIds = workspaceRepository.findByOrganizationId(organizationId).stream()
                    .map(Workspace::getId)
                    .toList();
            List<String> projectIds = new ArrayList<>();
            for (String wsId : workspaceIds) {
                projectRepository.findByWorkspaceId(wsId).forEach(p -> projectIds.add(p.getId()));
            }
            return projectIds.isEmpty() ? new ArrayList<>() : new ArrayList<>(taskRepository.findByProjectIdIn(projectIds));
        }
        return new ArrayList<>(taskRepository.findAll());
    }

    private void applyFilters(List<Task> tasks, TaskFilterQuery query) {
        filterBySprint(tasks, query.sprintId());
        filterByParentTask(tasks, query.parentTaskId());
        filterByPriorities(tasks, query.priorities());
        filterByStatuses(tasks, query.statuses());
        filterByTypes(tasks, query.types());
        filterBySearch(tasks, query.search());
        filterByDateRange(tasks, query.from(), query.to(), query.dateField());
    }

    private void filterBySprint(List<Task> tasks, String sprintId) {
        if (sprintId != null && !sprintId.isBlank()) {
            Set<String> sprintSet = parseCommaSeparatedSet(sprintId);
            boolean includeBacklog = sprintSet.contains("null") || sprintSet.contains("backlog") || sprintSet.contains("none");
            tasks.removeIf(t -> t.getSprintId() == null ? !includeBacklog : !sprintSet.contains(t.getSprintId()));
        }
    }

    private void filterByDateRange(List<Task> tasks, String from, String to, String dateField) {
        if (from == null && to == null) return;
        try {
            LocalDateTime fromDate = (from != null && !from.isBlank()) ? parseIsoDate(from) : null;
            LocalDateTime toDate = (to != null && !to.isBlank()) ? parseIsoDate(to) : null;

            tasks.removeIf(t -> {
                LocalDateTime targetDate = resolveTaskDate(t, dateField);
                return targetDate != null && (
                        (fromDate != null && targetDate.isBefore(fromDate))
                        || (toDate != null && targetDate.isAfter(toDate))
                );
            });
        } catch (Exception _) {
            // Ignore parse errors
        }
    }

    private LocalDateTime resolveTaskDate(Task t, String dateField) {
        String field = dateField != null ? dateField.toLowerCase() : "duedate";
        return switch (field) {
            case "startdate" -> t.getStartDate();
            case "createdat" -> t.getCreatedAt();
            default -> t.getDueDate() != null ? t.getDueDate() : t.getCreatedAt();
        };
    }

    private LocalDateTime parseIsoDate(String dateStr) {
        try {
            return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception _) {
            try {
                return java.time.LocalDate.parse(dateStr, DateTimeFormatter.ISO_DATE).atStartOfDay();
            } catch (Exception _) {
                return null;
            }
        }
    }

    private void filterByParentTask(List<Task> tasks, String parentTaskId) {
        if (parentTaskId != null && !parentTaskId.isBlank() && !"all".equalsIgnoreCase(parentTaskId)) {
            tasks.removeIf(t -> !Objects.equals(t.getParentTaskId(), parentTaskId));
        }
    }

    private void filterByPriorities(List<Task> tasks, String priorities) {
        if (priorities == null || priorities.isBlank()) return;
        Set<String> prioritySet = parseCommaSeparatedSet(priorities);
        if (!prioritySet.isEmpty()) {
            tasks.removeIf(t -> t.getPriority() == null || !prioritySet.contains(t.getPriority().name()));
        }
    }

    private void filterByStatuses(List<Task> tasks, String statuses) {
        if (statuses == null || statuses.isBlank()) return;
        Set<String> statusSet = parseCommaSeparatedSet(statuses);
        if (!statusSet.isEmpty()) {
            tasks.removeIf(t -> t.getStatusId() == null || !statusSet.contains(t.getStatusId()));
        }
    }

    private void filterByTypes(List<Task> tasks, String types) {
        if (types == null || types.isBlank()) return;
        Set<String> typeSet = parseCommaSeparatedSet(types);
        if (!typeSet.isEmpty()) {
            tasks.removeIf(t -> t.getType() == null || !typeSet.contains(t.getType().name()));
        }
    }

    private void filterBySearch(List<Task> tasks, String search) {
        if (search == null || search.isBlank()) return;
        String q = search.toLowerCase().trim();
        tasks.removeIf(t -> {
            boolean titleMatch = t.getTitle() != null && t.getTitle().toLowerCase().contains(q);
            boolean descMatch = t.getDescription() != null && t.getDescription().toLowerCase().contains(q);
            boolean slugMatch = t.getSlug() != null && t.getSlug().toLowerCase().contains(q);
            return !titleMatch && !descMatch && !slugMatch;
        });
    }

    private Set<String> parseCommaSeparatedSet(String commaSeparated) {
        return Arrays.stream(commaSeparated.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    public List<TaskResponse> getTasksByProject(String projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::buildTaskResponse)
                .toList();
    }

    public TaskResponse getTaskById(String id) {
        Task task = findTaskOrThrow(id);
        return buildTaskResponse(task);
    }

    public TaskResponse getTaskBySlug(String slug) {
        Task task = taskRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with slug: " + slug));
        return buildTaskResponse(task);
    }

    @org.springframework.cache.annotation.CacheEvict(value = {"org_analytics", "project_charts"}, allEntries = true)
    public TaskResponse updateTaskStatus(String id, String statusId, String userId) {
        Task task = findTaskOrThrow(id);
        updateStatusField(task, statusId);
        task.setUpdatedBy(userId);
        Task updated = taskRepository.save(task);
        return buildTaskResponse(updated);
    }

    @org.springframework.cache.annotation.CacheEvict(value = {"org_analytics", "project_charts"}, allEntries = true)
    public Map<String, Object> bulkCreateTasks(BulkCreateTasksRequest request, String userId) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        int createdCount = 0;
        int failedCount = 0;

        if (request.getTasks() != null) {
            for (BulkCreateTasksRequest.TaskItem item : request.getTasks()) {
                try {
                    int nextTaskNumber = taskRepository.findMaxTaskNumberByProjectId(project.getId()) + 1;
                    String slug = buildTaskSlug(project.getTaskPrefix(), nextTaskNumber);

                    Task task = Task.builder()
                            .title(item.getTitle().trim())
                            .description(item.getDescription())
                            .type(item.getType() != null ? item.getType() : TaskType.TASK)
                            .priority(item.getPriority() != null ? item.getPriority() : TaskPriority.MEDIUM)
                            .taskNumber(nextTaskNumber)
                            .slug(slug)
                            .startDate(item.getStartDate())
                            .dueDate(item.getDueDate())
                            .storyPoints(item.getStoryPoints())
                            .projectId(project.getId())
                            .statusId(request.getStatusId())
                            .sprintId(request.getSprintId())
                            .createdBy(userId)
                            .build();

                    taskRepository.save(task);
                    createdCount++;
                } catch (Exception e) {
                    log.warn("Failed to create task in bulk: {}", e.getMessage());
                    failedCount++;
                }
            }
        }
        return Map.of("created", createdCount, "failed", failedCount);
    }

    private List<String> resolveTargetTaskIds(BulkDeleteTasksRequest request) {
        List<String> targetIds = new ArrayList<>();
        if (Boolean.TRUE.equals(request.getAll()) && request.getProjectId() != null) {
            List<Task> projectTasks = taskRepository.findByProjectId(request.getProjectId());
            Set<String> excluded = request.getExcludedIds() != null ? new HashSet<>(request.getExcludedIds()) : Set.of();
            for (Task t : projectTasks) {
                if (!excluded.contains(t.getId())) {
                    targetIds.add(t.getId());
                }
            }
        } else if (request.getTaskIds() != null) {
            targetIds.addAll(request.getTaskIds());
        }
        return targetIds;
    }

    public Map<String, Object> bulkDeleteTasks(BulkDeleteTasksRequest request) {
        int deletedCount = 0;
        List<Map<String, String>> failedTasks = new ArrayList<>();
        List<String> targetIds = resolveTargetTaskIds(request);

        for (String id : targetIds) {
            try {
                Task task = taskRepository.findById(id).orElse(null);
                if (task != null) {
                    taskAssigneeRepository.deleteByTaskId(task.getId());
                    taskRepository.delete(task);
                    deletedCount++;
                }
            } catch (Exception e) {
                log.warn("Failed to delete task in bulk: {}", e.getMessage());
                String reason = e.getMessage() != null ? e.getMessage() : DEFAULT_UNKNOWN_ERROR;
                failedTasks.add(Map.of("id", id, KEY_REASON, reason));
            }
        }

        return Map.of(
                "deletedCount", deletedCount,
                KEY_FAILED_TASKS, failedTasks
        );
    }

    public Map<String, Object> bulkUpdateTasksStatus(BulkUpdateTaskStatusRequest request, String userId) {
        int updatedCount = 0;
        List<TaskResponse> updatedTasks = new ArrayList<>();
        List<Map<String, String>> failedTasks = new ArrayList<>();

        if (request.getTaskIds() != null && request.getStatusId() != null) {
            for (String id : request.getTaskIds()) {
                try {
                    Task task = taskRepository.findById(id).orElse(null);
                    if (task != null) {
                        updateStatusField(task, request.getStatusId());
                        task.setUpdatedBy(userId);
                        Task saved = taskRepository.save(task);
                        updatedTasks.add(buildTaskResponse(saved));
                        updatedCount++;
                    }
                } catch (Exception e) {
                    String reason = e.getMessage() != null ? e.getMessage() : DEFAULT_UNKNOWN_ERROR;
                    failedTasks.add(Map.of("id", id, KEY_REASON, reason));
                }
            }
        }

        return Map.of(
                "updatedCount", updatedCount,
                "updatedTasks", updatedTasks,
                KEY_FAILED_TASKS, failedTasks
        );
    }

    public Map<String, Object> bulkAssignTasks(BulkAssignTasksRequest request, String userId) {
        int assignedCount = 0;
        List<TaskResponse> updatedTasks = new ArrayList<>();
        List<Map<String, String>> failedTasks = new ArrayList<>();

        if (request.getTaskIds() != null && request.getAssigneeIds() != null) {
            for (String id : request.getTaskIds()) {
                try {
                    TaskResponse resp = assignTaskAssignees(id, request.getAssigneeIds(), userId);
                    updatedTasks.add(resp);
                    assignedCount++;
                } catch (Exception e) {
                    String reason = e.getMessage() != null ? e.getMessage() : DEFAULT_UNKNOWN_ERROR;
                    failedTasks.add(Map.of("id", id, KEY_REASON, reason));
                }
            }
        }

        return Map.of(
                "assignedCount", assignedCount,
                "updatedTasks", updatedTasks,
                KEY_FAILED_TASKS, failedTasks
        );
    }

    public TaskResponse assignTaskAssignees(String taskId, List<String> assigneeIds, String userId) {
        Task task = findTaskOrThrow(taskId);
        taskAssigneeRepository.deleteByTaskId(task.getId());

        if (assigneeIds != null) {
            for (String aId : assigneeIds) {
                if (aId != null && !aId.isBlank()) {
                    TaskAssignee assignee = TaskAssignee.builder()
                            .taskId(task.getId())
                            .userId(aId.trim())
                            .build();
                    taskAssigneeRepository.save(assignee);
                }
            }
        }

        task.setUpdatedBy(userId);
        taskRepository.save(task);
        return buildTaskResponse(task);
    }

    public TaskResponse addRecurrence(String taskId, Map<String, Object> config, String userId) {
        Task task = findTaskOrThrow(taskId);
        task.setIsRecurring(true);
        if (config != null && config.get(KEY_RECURRING_TASK_ID) != null) {
            task.setRecurringTaskId(String.valueOf(config.get(KEY_RECURRING_TASK_ID)));
        }
        task.setUpdatedBy(userId);
        taskRepository.save(task);
        return buildTaskResponse(task);
    }

    public TaskResponse updateRecurrence(String taskId, Map<String, Object> config, String userId) {
        Task task = findTaskOrThrow(taskId);
        if (config != null) {
            if (config.containsKey(KEY_IS_RECURRING)) {
                task.setIsRecurring(Boolean.TRUE.equals(config.get(KEY_IS_RECURRING)));
            }
            if (config.get(KEY_RECURRING_TASK_ID) != null) {
                task.setRecurringTaskId(String.valueOf(config.get(KEY_RECURRING_TASK_ID)));
            }
        }
        task.setUpdatedBy(userId);
        taskRepository.save(task);
        return buildTaskResponse(task);
    }

    public TaskResponse stopRecurrence(String taskId, String userId) {
        Task task = findTaskOrThrow(taskId);
        task.setIsRecurring(false);
        task.setRecurringTaskId(null);
        task.setUpdatedBy(userId);
        taskRepository.save(task);
        return buildTaskResponse(task);
    }

    public TaskResponse completeOccurrence(String taskId, String userId) {
        Task task = findTaskOrThrow(taskId);
        task.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
        task.setUpdatedBy(userId);
        taskRepository.save(task);
        return buildTaskResponse(task);
    }

    public List<TaskResponse> getTasksByProjectId(String projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::buildTaskResponse)
                .toList();
    }

    public List<TaskResponse> getTasksBySprintId(String sprintId) {
        return taskRepository.findBySprintId(sprintId).stream()
                .map(this::buildTaskResponse)
                .toList();
    }

    @org.springframework.cache.annotation.CacheEvict(value = {"org_analytics", "project_charts"}, allEntries = true)
    public void deleteTask(String id) {
        Task task = findTaskOrThrow(id);
        taskAssigneeRepository.deleteByTaskId(task.getId());
        taskRepository.delete(task);
    }

    private Task findTaskOrThrow(String idOrSlug) {
        if (idOrSlug == null || idOrSlug.isBlank()) {
            throw new ResourceNotFoundException(TASK_NOT_FOUND_MSG + idOrSlug);
        }
        if (UUID_PATTERN.matcher(idOrSlug).matches()) {
            return taskRepository.findById(idOrSlug)
                    .orElseThrow(() -> new ResourceNotFoundException(TASK_NOT_FOUND_MSG + idOrSlug));
        }
        return taskRepository.findBySlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException(TASK_NOT_FOUND_MSG + idOrSlug));
    }

    private TaskResponse buildTaskResponse(Task task) {
        TaskStatus status = taskStatusRepository.findById(task.getStatusId()).orElse(null);

        List<TaskAssignee> assignees = taskAssigneeRepository.findByTaskId(task.getId());
        List<TaskResponse.AssigneeDto> assigneeDtos = new ArrayList<>();

        for (TaskAssignee a : assignees) {
            userRepository.findById(a.getUserId()).ifPresent(u ->
                assigneeDtos.add(TaskResponse.AssigneeDto.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .avatar(u.getAvatar())
                        .build())
            );
        }

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .type(task.getType())
                .priority(task.getPriority())
                .taskNumber(task.getTaskNumber())
                .slug(task.getSlug())
                .startDate(task.getStartDate())
                .dueDate(task.getDueDate())
                .completedAt(task.getCompletedAt())
                .storyPoints(task.getStoryPoints())
                .projectId(task.getProjectId())
                .statusId(task.getStatusId())
                .sprintId(task.getSprintId())
                .parentTaskId(task.getParentTaskId())
                .status(status)
                .assignees(assigneeDtos)
                .createdBy(task.getCreatedBy())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
