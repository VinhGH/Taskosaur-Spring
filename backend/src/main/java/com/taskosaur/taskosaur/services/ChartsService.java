package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.enums.SprintStatus;
import com.taskosaur.taskosaur.enums.TaskType;
import com.taskosaur.taskosaur.models.*;
import com.taskosaur.taskosaur.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ChartsService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;

    private double calculatePercentage(long numerator, long denominator) {
        if (denominator == 0) return 0.0;
        return Math.round(((double) numerator / denominator) * 1000.0) / 10.0;
    }

    /**
     * Get real-time charts data for an organization with Redis Caching.
     */
    @org.springframework.cache.annotation.Cacheable(
            value = "org_analytics",
            key = "#orgId + '_' + (#types != null ? #types.toString() : 'all') + '_' + #filterWorkspaceId + '_' + #filterProjectId"
    )
    public Map<String, Object> getOrganizationCharts(
            String orgId,
            String userId,
            List<String> types,
            String filterWorkspaceId,
            String filterProjectId
    ) {
        Map<String, Object> result = new HashMap<>();

        // 1. Fetch organization workspaces & projects
        List<Workspace> workspaces = workspaceRepository.findByOrganizationId(orgId).stream()
                .filter(w -> !Boolean.TRUE.equals(w.isArchive()))
                .filter(w -> filterWorkspaceId == null || filterWorkspaceId.isBlank() || w.getId().equals(filterWorkspaceId))
                .toList();

        List<String> workspaceIds = workspaces.stream().map(Workspace::getId).toList();

        List<Project> projects = projectRepository.findAll().stream()
                .filter(p -> workspaceIds.contains(p.getWorkspaceId()))
                .filter(p -> !Boolean.TRUE.equals(p.getArchive()))
                .filter(p -> filterProjectId == null || filterProjectId.isBlank() || p.getId().equals(filterProjectId))
                .toList();

        List<String> projectIds = projects.stream().map(Project::getId).toList();

        // 2. Fetch tasks & members
        List<Task> tasks = taskRepository.findAll().stream()
                .filter(t -> projectIds.contains(t.getProjectId()))
                .toList();

        List<OrganizationMember> members = organizationMemberRepository.findByOrganizationId(orgId);

        List<Sprint> sprints = sprintRepository.findAll().stream()
                .filter(s -> projectIds.contains(s.getProjectId()))
                .filter(s -> !Boolean.TRUE.equals(s.getArchive()))
                .toList();

        LocalDateTime now = LocalDateTime.now();

        // Compute metrics
        long totalWorkspaces = workspaces.size();
        long activeWorkspaces = workspaces.size();
        long totalProjects = projects.size();
        long activeProjects = projects.stream().filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus().name()) || "PLANNING".equalsIgnoreCase(p.getStatus().name())).count();
        long completedProjects = projects.stream().filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus().name())).count();
        long totalMembers = members.size();

        long totalTasks = tasks.size();
        long completedTasks = tasks.stream().filter(t -> t.getCompletedAt() != null).count();
        long overdueTasks = tasks.stream().filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(now) && t.getCompletedAt() == null).count();
        long totalBugs = tasks.stream().filter(t -> t.getType() == TaskType.BUG).count();
        long resolvedBugs = tasks.stream().filter(t -> t.getType() == TaskType.BUG && t.getCompletedAt() != null).count();
        long activeSprints = sprints.stream().filter(s -> s.getStatus() == SprintStatus.ACTIVE).count();

        double taskCompletionRate = calculatePercentage(completedTasks, totalTasks);
        double projectCompletionRate = calculatePercentage(completedProjects, totalProjects);
        double bugResolutionRate = calculatePercentage(resolvedBugs, totalBugs);

        // 1. KPI Metrics
        Map<String, Object> kpiMetrics = new HashMap<>();
        kpiMetrics.put("totalWorkspaces", totalWorkspaces);
        kpiMetrics.put("activeWorkspaces", activeWorkspaces);
        kpiMetrics.put("totalProjects", totalProjects);
        kpiMetrics.put("activeProjects", activeProjects);
        kpiMetrics.put("completedProjects", completedProjects);
        kpiMetrics.put("totalMembers", totalMembers);
        kpiMetrics.put("totalTasks", totalTasks);
        kpiMetrics.put("completedTasks", completedTasks);
        kpiMetrics.put("overdueTasks", overdueTasks);
        kpiMetrics.put("totalBugs", totalBugs);
        kpiMetrics.put("resolvedBugs", resolvedBugs);
        kpiMetrics.put("activeSprints", activeSprints);
        kpiMetrics.put("projectCompletionRate", projectCompletionRate);
        kpiMetrics.put("taskCompletionRate", taskCompletionRate);
        kpiMetrics.put("bugResolutionRate", bugResolutionRate);
        kpiMetrics.put("overallProductivity", taskCompletionRate);
        result.put("kpi-metrics", kpiMetrics);

        // 2. Project Portfolio (Status Distribution)
        Map<String, Long> projStatusCounts = projects.stream()
                .collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting()));
        List<Map<String, Object>> portfolio = new ArrayList<>();
        projStatusCounts.forEach((status, count) -> {
            portfolio.add(Map.of(
                    "status", status,
                    "_count", Map.of("status", count),
                    "count", count
            ));
        });
        result.put("project-portfolio", portfolio);

        // 3. Workspace Project Count
        List<Map<String, Object>> wsProjectCount = workspaces.stream().map(w -> {
            long count = projects.stream().filter(p -> p.getWorkspaceId().equals(w.getId())).count();
            Map<String, Object> item = new HashMap<>();
            item.put("workspaceId", w.getId());
            item.put("workspaceName", w.getName());
            item.put("workspaceSlug", w.getSlug());
            item.put("projectCount", count);
            return item;
        }).toList();
        result.put("workspace-project-count", wsProjectCount);

        // 4. Task Distribution by Priority
        Map<String, Long> priorityCounts = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()));
        List<Map<String, Object>> taskDistribution = new ArrayList<>();
        priorityCounts.forEach((priority, count) -> {
            taskDistribution.add(Map.of(
                    "priority", priority,
                    "_count", Map.of("priority", count),
                    "count", count
            ));
        });
        result.put("task-distribution", taskDistribution);

        // 5. Task Type Distribution
        Map<TaskType, Long> typeCounts = tasks.stream()
                .collect(Collectors.groupingBy(Task::getType, Collectors.counting()));
        List<Map<String, Object>> taskTypeDistribution = new ArrayList<>();
        typeCounts.forEach((type, count) -> {
            taskTypeDistribution.add(Map.of(
                    "type", type.name(),
                    "_count", Map.of("type", count),
                    "count", count
            ));
        });
        result.put("task-type", taskTypeDistribution);

        // 6. Quality Metrics
        Map<String, Object> qualityMetrics = new HashMap<>();
        qualityMetrics.put("totalBugs", totalBugs);
        qualityMetrics.put("resolvedBugs", resolvedBugs);
        qualityMetrics.put("criticalBugs", tasks.stream().filter(t -> t.getType() == TaskType.BUG && "HIGHEST".equalsIgnoreCase(t.getPriority().name())).count());
        qualityMetrics.put("resolvedCriticalBugs", tasks.stream().filter(t -> t.getType() == TaskType.BUG && "HIGHEST".equalsIgnoreCase(t.getPriority().name()) && t.getCompletedAt() != null).count());
        qualityMetrics.put("bugResolutionRate", bugResolutionRate);
        result.put("quality-metrics", qualityMetrics);

        // 7. Team Utilization (Role Distribution) & Member Workload
        Map<String, Long> roleCounts = members.stream()
                .collect(Collectors.groupingBy(m -> m.getRole().name(), Collectors.counting()));
        List<Map<String, Object>> teamUtilization = new ArrayList<>();
        roleCounts.forEach((role, count) -> {
            teamUtilization.add(Map.of(
                    "role", role,
                    "_count", Map.of("role", count),
                    "count", count
            ));
        });
        result.put("team-utilization", teamUtilization);

        List<Map<String, Object>> memberWorkload = new ArrayList<>();
        for (OrganizationMember m : members) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            String name = u != null ? (u.getFirstName() + " " + u.getLastName()).trim() : "Member";
            long assignedCount = taskAssigneeRepository.findAll().stream()
                    .filter(a -> a.getUserId().equals(m.getUserId()))
                    .filter(a -> tasks.stream().anyMatch(t -> t.getId().equals(a.getTaskId())))
                    .count();

            Map<String, Object> loadItem = new HashMap<>();
            loadItem.put("memberId", m.getUserId());
            loadItem.put("memberName", name);
            loadItem.put("activeTasks", assignedCount);
            loadItem.put("reportedTasks", 0);
            memberWorkload.add(loadItem);
        }
        result.put("member-workload", memberWorkload);

        // 8. Sprint Metrics & Resource Allocation
        Map<SprintStatus, Long> sprintStatusCounts = sprints.stream()
                .collect(Collectors.groupingBy(Sprint::getStatus, Collectors.counting()));
        List<Map<String, Object>> sprintMetrics = new ArrayList<>();
        sprintStatusCounts.forEach((status, count) -> {
            sprintMetrics.add(Map.of(
                    "status", status.name(),
                    "_count", Map.of("status", count),
                    "count", count
            ));
        });
        result.put("sprint-metrics", sprintMetrics);
        result.put("resource-allocation", List.of());

        return result;
    }

    /**
     * Get real-time charts data for a workspace.
     */
    public Map<String, Object> getWorkspaceCharts(
            String organizationId,
            String workspaceSlug,
            String userId,
            List<String> types
    ) {
        Map<String, Object> result = new HashMap<>();

        // 1. Locate workspace
        Workspace workspace = workspaceRepository.findByOrganizationIdAndSlug(organizationId, workspaceSlug)
                .or(() -> {
                    List<Workspace> list = workspaceRepository.findByOrganizationId(organizationId);
                    return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
                })
                .orElse(null);

        if (workspace == null) {
            return Map.of("kpi-metrics", Map.of("totalProjects", 0, "activeProjects", 0, "completionRate", 0, "totalTasks", 0, "completedTasks", 0, "overdueTasks", 0));
        }

        // 2. Fetch projects & tasks for this workspace
        List<Project> projects = projectRepository.findByWorkspaceId(workspace.getId()).stream()
                .filter(p -> !Boolean.TRUE.equals(p.getArchive()))
                .toList();

        List<String> projectIds = projects.stream().map(Project::getId).toList();

        List<Task> tasks = taskRepository.findAll().stream()
                .filter(t -> projectIds.contains(t.getProjectId()))
                .toList();

        List<Sprint> sprints = sprintRepository.findAll().stream()
                .filter(s -> projectIds.contains(s.getProjectId()))
                .filter(s -> !Boolean.TRUE.equals(s.getArchive()))
                .toList();

        LocalDateTime now = LocalDateTime.now();

        long totalProjects = projects.size();
        long activeProjects = projects.stream().filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus().name()) || "PLANNING".equalsIgnoreCase(p.getStatus().name())).count();
        long completedProjects = projects.stream().filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus().name())).count();
        long totalTasks = tasks.size();
        long completedTasks = tasks.stream().filter(t -> t.getCompletedAt() != null).count();
        long overdueTasks = tasks.stream().filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(now) && t.getCompletedAt() == null).count();
        double completionRate = calculatePercentage(completedTasks, totalTasks);
        long activeSprints = sprints.stream().filter(s -> s.getStatus() == SprintStatus.ACTIVE).count();

        // 1. KPI Metrics
        Map<String, Object> kpiMetrics = new HashMap<>();
        kpiMetrics.put("totalProjects", totalProjects);
        kpiMetrics.put("activeProjects", activeProjects);
        kpiMetrics.put("completedProjects", completedProjects);
        kpiMetrics.put("totalTasks", totalTasks);
        kpiMetrics.put("completedTasks", completedTasks);
        kpiMetrics.put("overdueTasks", overdueTasks);
        kpiMetrics.put("completionRate", completionRate);
        kpiMetrics.put("taskCompletionRate", completionRate);
        kpiMetrics.put("activeSprints", activeSprints);
        result.put("kpi-metrics", kpiMetrics);

        // 2. Project Status Distribution
        Map<String, Long> projStatusCounts = projects.stream()
                .collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting()));
        List<Map<String, Object>> projectStatus = new ArrayList<>();
        projStatusCounts.forEach((status, count) -> {
            projectStatus.add(Map.of(
                    "status", status,
                    "_count", Map.of("status", count),
                    "count", count
            ));
        });
        result.put("project-status", projectStatus);

        // 3. Task Priority Breakdown
        Map<String, Long> priorityCounts = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()));
        List<Map<String, Object>> taskPriority = new ArrayList<>();
        priorityCounts.forEach((priority, count) -> {
            taskPriority.add(Map.of(
                    "priority", priority,
                    "_count", Map.of("priority", count),
                    "count", count
            ));
        });
        result.put("task-priority", taskPriority);

        // 4. Task Type Distribution
        Map<TaskType, Long> typeCounts = tasks.stream()
                .collect(Collectors.groupingBy(Task::getType, Collectors.counting()));
        List<Map<String, Object>> taskType = new ArrayList<>();
        typeCounts.forEach((type, count) -> {
            taskType.add(Map.of(
                    "type", type.name(),
                    "_count", Map.of("type", count),
                    "count", count
            ));
        });
        result.put("task-type", taskType);

        // 5. Sprint Status Overview
        Map<SprintStatus, Long> sprintStatusCounts = sprints.stream()
                .collect(Collectors.groupingBy(Sprint::getStatus, Collectors.counting()));
        List<Map<String, Object>> sprintStatus = new ArrayList<>();
        sprintStatusCounts.forEach((status, count) -> {
            sprintStatus.add(Map.of(
                    "status", status.name(),
                    "_count", Map.of("status", count),
                    "count", count
            ));
        });
        result.put("sprint-status", sprintStatus);

        // 6. Monthly Task Completion
        List<Map<String, Object>> monthly = new ArrayList<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0);
            String monthKey = monthStart.format(monthFmt);
            long mCompleted = tasks.stream().filter(t -> t.getCompletedAt() != null && t.getCompletedAt().format(monthFmt).equals(monthKey)).count();
            long mCreated = tasks.stream().filter(t -> t.getCreatedAt() != null && t.getCreatedAt().format(monthFmt).equals(monthKey)).count();
            monthly.add(Map.of("month", monthKey, "completed", mCompleted, "created", mCreated));
        }
        result.put("monthly-completion", monthly);

        result.put("workspace-activity", List.of());
        result.put("member-workload", List.of());
        result.put("resource-allocation", List.of());

        return result;
    }
}
