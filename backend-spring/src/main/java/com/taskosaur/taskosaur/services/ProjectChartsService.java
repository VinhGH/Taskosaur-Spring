package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.enums.SprintStatus;
import com.taskosaur.taskosaur.enums.TaskType;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.Sprint;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectChartsService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final TaskStatusRepository taskStatusRepository;

    public Map<String, Object> getProjectCharts(String slug, List<String> types) {
        Project project = projectRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with slug: " + slug));

        List<Task> tasks = taskRepository.findByProjectId(project.getId());
        List<Sprint> sprints = sprintRepository.findByProjectIdAndArchiveFalse(project.getId());
        List<TaskStatus> allStatuses = project.getWorkflowId() != null
                ? taskStatusRepository.findByWorkflowIdOrderByPositionAsc(project.getWorkflowId())
                : taskStatusRepository.findAll();

        Map<String, Object> result = new HashMap<>();

        // 1. KPI Metrics
        result.put("kpi-metrics", calculateKpiMetrics(tasks, sprints));

        // 2. Task Status Flow
        result.put("task-status", calculateTaskStatusFlow(tasks, allStatuses));

        // 3. Task Type Distribution
        result.put("task-type", calculateTaskTypeDistribution(tasks));

        // 4. Task Priority Distribution
        result.put("task-priority", calculateTaskPriorityDistribution(tasks));

        // 5. Sprint Velocity Trend
        result.put("sprint-velocity", calculateSprintVelocity(tasks, sprints));

        // 6. Sprint Burndown
        result.put("burndown", calculateBurndown(tasks, sprints));

        return result;
    }

    private Map<String, Object> calculateKpiMetrics(List<Task> tasks, List<Sprint> sprints) {
        long totalTasks = tasks.size();
        long completedTasks = tasks.stream()
                .filter(t -> t.getCompletedAt() != null)
                .count();

        long activeSprints = sprints.stream()
                .filter(s -> s.getStatus() == SprintStatus.ACTIVE)
                .count();

        long totalBugs = tasks.stream()
                .filter(t -> t.getType() == TaskType.BUG)
                .count();

        long resolvedBugs = tasks.stream()
                .filter(t -> t.getType() == TaskType.BUG && t.getCompletedAt() != null)
                .count();

        double completionRate = totalTasks > 0
                ? Math.round(((double) completedTasks / totalTasks) * 10000.0) / 100.0
                : 0.0;

        double bugResolutionRate = totalBugs > 0
                ? Math.round(((double) resolvedBugs / totalBugs) * 10000.0) / 100.0
                : 0.0;

        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalTasks", totalTasks);
        kpi.put("completedTasks", completedTasks);
        kpi.put("activeSprints", activeSprints);
        kpi.put("totalBugs", totalBugs);
        kpi.put("resolvedBugs", resolvedBugs);
        kpi.put("completionRate", completionRate);
        kpi.put("bugResolutionRate", bugResolutionRate);
        return kpi;
    }

    private List<Map<String, Object>> calculateTaskStatusFlow(List<Task> tasks, List<TaskStatus> allStatuses) {
        Map<String, Long> taskCountByStatus = tasks.stream()
                .filter(t -> t.getStatusId() != null)
                .collect(Collectors.groupingBy(Task::getStatusId, Collectors.counting()));

        return allStatuses.stream().map(st -> {
            Map<String, Object> item = new HashMap<>();
            item.put("statusId", st.getId());
            item.put("count", taskCountByStatus.getOrDefault(st.getId(), 0L));
            item.put("status", Map.of(
                    "id", st.getId(),
                    "name", st.getName(),
                    "color", st.getColor() != null ? st.getColor() : "#6b7280",
                    "category", st.getCategory() != null ? st.getCategory().name() : "TODO",
                    "position", st.getPosition() != null ? st.getPosition() : 0
            ));
            return item;
        }).toList();
    }

    private List<Map<String, Object>> calculateTaskTypeDistribution(List<Task> tasks) {
        Map<String, Long> countByType = tasks.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getType() != null ? t.getType().name() : "TASK",
                        Collectors.counting()
                ));

        return countByType.entrySet().stream().map(e -> {
            Map<String, Object> item = new HashMap<>();
            item.put("type", e.getKey());
            item.put("_count", Map.of("type", e.getValue()));
            return item;
        }).toList();
    }

    private List<Map<String, Object>> calculateTaskPriorityDistribution(List<Task> tasks) {
        Map<String, Long> countByPriority = tasks.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getPriority() != null ? t.getPriority().name() : "MEDIUM",
                        Collectors.counting()
                ));

        return countByPriority.entrySet().stream().map(e -> {
            Map<String, Object> item = new HashMap<>();
            item.put("priority", e.getKey());
            item.put("_count", Map.of("priority", e.getValue()));
            return item;
        }).toList();
    }

    private List<Map<String, Object>> calculateSprintVelocity(List<Task> tasks, List<Sprint> sprints) {
        Map<String, List<Task>> tasksBySprint = tasks.stream()
                .filter(t -> t.getSprintId() != null)
                .collect(Collectors.groupingBy(Task::getSprintId));

        return sprints.stream().map(s -> {
            List<Task> sprintTasks = tasksBySprint.getOrDefault(s.getId(), List.of());
            long velocity = sprintTasks.stream()
                    .filter(t -> t.getCompletedAt() != null)
                    .mapToLong(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 1)
                    .sum();

            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("name", s.getName());
            item.put("startDate", s.getStartDate());
            item.put("endDate", s.getEndDate());
            item.put("velocity", velocity);
            return item;
        }).toList();
    }

    private List<Map<String, Object>> calculateBurndown(List<Task> tasks, List<Sprint> sprints) {
        return tasks.stream()
                .filter(t -> t.getSprintId() != null)
                .map(t -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("completedAt", t.getCompletedAt());
                    item.put("storyPoints", t.getStoryPoints() != null ? t.getStoryPoints() : 0);
                    item.put("createdAt", t.getCreatedAt());
                    return item;
                }).toList();
    }
}
