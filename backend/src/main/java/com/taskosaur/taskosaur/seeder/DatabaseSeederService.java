package com.taskosaur.taskosaur.seeder;

import com.taskosaur.taskosaur.enums.*;
import com.taskosaur.taskosaur.models.*;
import com.taskosaur.taskosaur.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeederService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkflowRepository workflowRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final SprintRepository sprintRepository;
    private final LabelRepository labelRepository;
    private final TaskRepository taskRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final TaskLabelRepository taskLabelRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskRankRepository taskRankRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Map<String, Object> seedAll() {
        log.info("Starting database seeding for Taskosaur...");

        // 1. Create Users
        String encodedPassword = passwordEncoder.encode("Password123!");

        User admin = userRepository.findByEmail("admin@taskosaur.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .email("admin@taskosaur.com")
                        .username("vinh_admin")
                        .firstName("Vinh")
                        .lastName("Admin")
                        .password(encodedPassword)
                        .role(Role.SUPER_ADMIN)
                        .status(UserStatus.ACTIVE)
                        .bio("Lead System Architect & Full-Stack Developer")
                        .language("vi")
                        .timezone("Asia/Ho_Chi_Minh")
                        .build())
        );

        User sarah = userRepository.findByEmail("sarah.designer@taskosaur.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .email("sarah.designer@taskosaur.com")
                        .username("sarah_chen")
                        .firstName("Sarah")
                        .lastName("Chen")
                        .password(encodedPassword)
                        .role(Role.MEMBER)
                        .status(UserStatus.ACTIVE)
                        .bio("UI/UX Product Designer & Design System Lead")
                        .language("en")
                        .timezone("Asia/Ho_Chi_Minh")
                        .build())
        );

        User alex = userRepository.findByEmail("alex.developer@taskosaur.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .email("alex.developer@taskosaur.com")
                        .username("alex_rivera")
                        .firstName("Alex")
                        .lastName("Rivera")
                        .password(encodedPassword)
                        .role(Role.MEMBER)
                        .status(UserStatus.ACTIVE)
                        .bio("Senior Backend Java 25 & Cloud Specialist")
                        .language("en")
                        .timezone("Asia/Ho_Chi_Minh")
                        .build())
        );

        User emily = userRepository.findByEmail("emily.qa@taskosaur.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .email("emily.qa@taskosaur.com")
                        .username("emily_watson")
                        .firstName("Emily")
                        .lastName("Watson")
                        .password(encodedPassword)
                        .role(Role.MEMBER)
                        .status(UserStatus.ACTIVE)
                        .bio("QA Automation Lead & Performance Tester")
                        .language("en")
                        .timezone("Asia/Ho_Chi_Minh")
                        .build())
        );

        // 2. Create Organization
        Organization org = organizationRepository.findBySlug("taskosaur-enterprise").orElseGet(() ->
                organizationRepository.save(Organization.builder()
                        .name("Taskosaur Enterprise")
                        .slug("taskosaur-enterprise")
                        .description("Global Agile Engineering, AI Task Automation & Cloud Operations")
                        .ownerId(admin.getId())
                        .createdBy(admin.getId())
                        .website("https://taskosaur.com")
                        .build())
        );

        // Add Members to Organization
        addOrgMember(org.getId(), admin.getId(), Role.OWNER);
        addOrgMember(org.getId(), sarah.getId(), Role.MANAGER);
        addOrgMember(org.getId(), alex.getId(), Role.MEMBER);
        addOrgMember(org.getId(), emily.getId(), Role.MEMBER);

        // Update default org
        admin.setDefaultOrganizationId(org.getId());
        sarah.setDefaultOrganizationId(org.getId());
        alex.setDefaultOrganizationId(org.getId());
        emily.setDefaultOrganizationId(org.getId());
        userRepository.saveAll(List.of(admin, sarah, alex, emily));

        // 3. Create Workspaces
        Workspace coreWs = workspaceRepository.findBySlug("core-platform").orElseGet(() ->
                workspaceRepository.save(Workspace.builder()
                        .name("Core Platform")
                        .slug("core-platform")
                        .description("Main SaaS application architecture, backend services and web client")
                        .color("#3B82F6")
                        .organizationId(org.getId())
                        .createdBy(admin.getId())
                        .build())
        );

        Workspace mobileWs = workspaceRepository.findBySlug("mobile-growth").orElseGet(() ->
                workspaceRepository.save(Workspace.builder()
                        .name("Mobile & Growth")
                        .slug("mobile-growth")
                        .description("Cross-platform mobile applications, API integrations, and analytics")
                        .color("#8B5CF6")
                        .organizationId(org.getId())
                        .createdBy(admin.getId())
                        .build())
        );

        addWorkspaceMember(coreWs.getId(), admin.getId(), WorkspaceRole.OWNER);
        addWorkspaceMember(coreWs.getId(), sarah.getId(), WorkspaceRole.MEMBER);
        addWorkspaceMember(coreWs.getId(), alex.getId(), WorkspaceRole.MEMBER);
        addWorkspaceMember(coreWs.getId(), emily.getId(), WorkspaceRole.MEMBER);

        addWorkspaceMember(mobileWs.getId(), admin.getId(), WorkspaceRole.OWNER);
        addWorkspaceMember(mobileWs.getId(), alex.getId(), WorkspaceRole.MEMBER);

        // 4. Create Workflow and Task Statuses for Core Workspace
        Workflow workflow = workflowRepository.findByOrganizationId(org.getId()).stream().findFirst().orElseGet(() ->
                workflowRepository.save(Workflow.builder()
                        .name("Standard Agile Workflow")
                        .description("To Do -> In Progress -> In Review -> Done")
                        .isDefault(true)
                        .organizationId(org.getId())
                        .createdBy(admin.getId())
                        .build())
        );

        TaskStatus statusTodo = getOrCreateStatus(workflow.getId(), "To Do", "#64748B", StatusCategory.TODO, 0, true, admin.getId());
        TaskStatus statusInProgress = getOrCreateStatus(workflow.getId(), "In Progress", "#3B82F6", StatusCategory.IN_PROGRESS, 1, false, admin.getId());
        TaskStatus statusInReview = getOrCreateStatus(workflow.getId(), "In Review", "#8B5CF6", StatusCategory.IN_PROGRESS, 2, false, admin.getId());
        TaskStatus statusDone = getOrCreateStatus(workflow.getId(), "Done", "#10B981", StatusCategory.DONE, 3, false, admin.getId());

        // 5. Create Projects
        Project project = projectRepository.findByWorkspaceIdAndSlug(coreWs.getId(), "taskosaur-web-ai").orElseGet(() ->
                projectRepository.save(Project.builder()
                        .name("Taskosaur Web & AI")
                        .slug("taskosaur-web-ai")
                        .taskPrefix("TSK")
                        .description("Next.js 16 Web Frontend & Java 25 Spring Boot AI Task Assistant Platform")
                        .color("#3B82F6")
                        .status(ProjectStatus.ACTIVE)
                        .priority(ProjectPriority.HIGH)
                        .visibility(ProjectVisibility.PUBLIC)
                        .workspaceId(coreWs.getId())
                        .workflowId(workflow.getId())
                        .createdBy(admin.getId())
                        .startDate(LocalDateTime.now().minusDays(15))
                        .endDate(LocalDateTime.now().plusDays(45))
                        .build())
        );

        addProjectMember(project.getId(), admin.getId(), Role.OWNER);
        addProjectMember(project.getId(), sarah.getId(), Role.MEMBER);
        addProjectMember(project.getId(), alex.getId(), Role.MEMBER);
        addProjectMember(project.getId(), emily.getId(), Role.MEMBER);

        // 6. Create Sprints
        Sprint sprint1 = getOrCreateSprint(project.getId(), "Sprint 1 - Foundation & Auth", "sprint-1",
                "Complete database schema, JWT stateless security, and basic CRUD",
                SprintStatus.COMPLETED, LocalDateTime.now().minusDays(21), LocalDateTime.now().minusDays(7), admin.getId());

        Sprint sprint2 = getOrCreateSprint(project.getId(), "Sprint 2 - AI Task Assistant & Gantt Chart", "sprint-2",
                "Integrate OpenRouter LLM, interactive Gantt drag-and-drop, and Calendar scheduler",
                SprintStatus.ACTIVE, LocalDateTime.now().minusDays(6), LocalDateTime.now().plusDays(8), admin.getId());

        Sprint sprint3 = getOrCreateSprint(project.getId(), "Sprint 3 - Performance & Cloud Deploy", "sprint-3",
                "Docker multi-stage optimization, Azure cloud automation, and stress testing",
                SprintStatus.PLANNING, LocalDateTime.now().plusDays(9), LocalDateTime.now().plusDays(23), admin.getId());

        // 7. Create Project Labels
        Label lblFrontend = getOrCreateLabel(project.getId(), "Frontend", "#3B82F6", "Next.js UI & Tailwind", admin.getId());
        Label lblBackend = getOrCreateLabel(project.getId(), "Backend", "#10B981", "Spring Boot & JPA", admin.getId());
        Label lblAi = getOrCreateLabel(project.getId(), "AI & LLM", "#8B5CF6", "OpenRouter & Agent Automation", admin.getId());
        Label lblBug = getOrCreateLabel(project.getId(), "Bug", "#EF4444", "High priority bug fix", admin.getId());
        Label lblDevops = getOrCreateLabel(project.getId(), "DevOps", "#F59E0B", "Docker & Azure Cloud", admin.getId());

        // 8. Create Tasks with rich data
        LocalDateTime now = LocalDateTime.now();

        createSampleTask(project.getId(), 1, "Implement Java 25 Spring Boot RESTful Controllers",
                "Port all legacy NestJS API routes to high-performance Spring Data JPA Controllers with DTO validation.",
                TaskType.TASK, TaskPriority.HIGH, statusDone.getId(), sprint1.getId(), alex.getId(), 5,
                now.minusDays(18), now.minusDays(12), now.minusDays(12),
                List.of(alex.getId()), List.of(lblBackend.getId()), admin.getId(),
                "Alex Rivera: Completed all 192 Java classes and passed integration unit tests.");

        createSampleTask(project.getId(), 2, "Design Glassmorphic UI with Tailwind & Dark Mode",
                "Build modern responsive components, Kanban boards, and multi-color Aurora background lighting.",
                TaskType.TASK, TaskPriority.HIGH, statusDone.getId(), sprint1.getId(), sarah.getId(), 8,
                now.minusDays(16), now.minusDays(10), now.minusDays(10),
                List.of(sarah.getId()), List.of(lblFrontend.getId()), admin.getId(),
                "Sarah Chen: All Figma tokens and dark mode colors are implemented.");

        createSampleTask(project.getId(), 3, "Implement Interactive Gantt Chart & Timeline View",
                "Add interactive drag-and-drop task rescheduling, dependency links, and milestone tracking.",
                TaskType.TASK, TaskPriority.HIGH, statusInProgress.getId(), sprint2.getId(), sarah.getId(), 8,
                now.minusDays(5), now.plusDays(4), null,
                List.of(sarah.getId(), alex.getId()), List.of(lblFrontend.getId()), admin.getId(),
                "Sarah Chen: Drag and drop handler is working. Testing timeline grid zoom.");

        createSampleTask(project.getId(), 4, "Connect OpenRouter AI Assistant & Prompt Engineering",
                "Build in-app conversational AI to parse natural language requests and execute project tasks automatically.",
                TaskType.TASK, TaskPriority.HIGHEST, statusInProgress.getId(), sprint2.getId(), admin.getId(), 13,
                now.minusDays(4), now.plusDays(3), null,
                List.of(admin.getId(), alex.getId()), List.of(lblAi.getId(), lblBackend.getId()), admin.getId(),
                "Vinh Admin: Integrated GPT-4o-mini and Gemini 2.0 Flash via OpenRouter. Response time is under 1.2s!");

        createSampleTask(project.getId(), 5, "Multi-language i18n Localization (6 Languages)",
                "Add native full localization for English, Tiếng Việt, Español, Français, Deutsch, Português.",
                TaskType.TASK, TaskPriority.MEDIUM, statusInReview.getId(), sprint2.getId(), emily.getId(), 3,
                now.minusDays(3), now.plusDays(2), null,
                List.of(emily.getId()), List.of(lblFrontend.getId()), admin.getId(),
                "Emily Watson: Verified Vietnamese translations for all settings and task details.");

        createSampleTask(project.getId(), 6, "Fix Calendar View Task Drag & Rescheduling Boundary",
                "Fix issue where dragging overdue tasks across month boundary didn't refresh day agenda.",
                TaskType.BUG, TaskPriority.HIGH, statusInReview.getId(), sprint2.getId(), alex.getId(), 3,
                now.minusDays(2), now.plusDays(1), null,
                List.of(alex.getId()), List.of(lblBug.getId(), lblFrontend.getId()), admin.getId(),
                "Alex Rivera: Added date normalization check. Ready for QA verification.");

        createSampleTask(project.getId(), 7, "Setup Multi-Stage Docker Compose & Nginx Reverse Proxy",
                "Create production container images with OpenJDK 25 and Nginx port 80 routing.",
                TaskType.TASK, TaskPriority.HIGH, statusDone.getId(), sprint2.getId(), admin.getId(), 5,
                now.minusDays(6), now.minusDays(1), now.minusDays(1),
                List.of(admin.getId()), List.of(lblDevops.getId()), admin.getId(),
                "Vinh Admin: Docker Compose verified. Multi-stage build reduces image size by 70%.");

        createSampleTask(project.getId(), 8, "Automated Azure Cloud Deployment & Domain DNS",
                "Deploy production stack to Microsoft Azure Ubuntu VM in Malaysia West with automated shutdown cron.",
                TaskType.TASK, TaskPriority.MEDIUM, statusDone.getId(), sprint2.getId(), admin.getId(), 5,
                now.minusDays(2), now, now,
                List.of(admin.getId()), List.of(lblDevops.getId()), admin.getId(),
                "Vinh Admin: Domain http://taskosaur-vinh.malaysiawest.cloudapp.azure.com is live!");

        createSampleTask(project.getId(), 9, "Implement Real-time WebSocket Notifications",
                "Setup live socket notifications for task assignments, comment mentions, and sprint updates.",
                TaskType.TASK, TaskPriority.MEDIUM, statusTodo.getId(), sprint3.getId(), alex.getId(), 8,
                now.plusDays(10), now.plusDays(18), null,
                List.of(alex.getId()), List.of(lblBackend.getId()), admin.getId(), null);

        createSampleTask(project.getId(), 10, "End-to-End Playwright Automated Test Suite",
                "Create automated test workflows covering login, task creation, kanban drag & drop, and settings.",
                TaskType.TASK, TaskPriority.MEDIUM, statusTodo.getId(), sprint3.getId(), emily.getId(), 5,
                now.plusDays(12), now.plusDays(20), null,
                List.of(emily.getId()), List.of(lblDevops.getId()), admin.getId(), null);

        log.info("Database seeding completed successfully for Taskosaur!");

        return Map.of(
                "success", true,
                "message", "Database seeded with 4 users, 1 organization, 2 workspaces, 1 project, 3 sprints, and 10 rich sample tasks!",
                "adminLogin", "admin@taskosaur.com / Password123!",
                "teamLogins", List.of(
                        "sarah.designer@taskosaur.com / Password123!",
                        "alex.developer@taskosaur.com / Password123!",
                        "emily.qa@taskosaur.com / Password123!"
                )
        );
    }

    private void addOrgMember(String orgId, String userId, Role role) {
        if (!organizationMemberRepository.existsByUserIdAndOrganizationId(userId, orgId)) {
            organizationMemberRepository.save(OrganizationMember.builder()
                    .organizationId(orgId)
                    .userId(userId)
                    .role(role)
                    .build());
        }
    }

    private void addWorkspaceMember(String wsId, String userId, WorkspaceRole role) {
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(wsId, userId)) {
            workspaceMemberRepository.save(WorkspaceMember.builder()
                    .workspaceId(wsId)
                    .userId(userId)
                    .role(role)
                    .build());
        }
    }

    private void addProjectMember(String projId, String userId, Role role) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projId, userId)) {
            projectMemberRepository.save(ProjectMember.builder()
                    .projectId(projId)
                    .userId(userId)
                    .role(role)
                    .build());
        }
    }

    private TaskStatus getOrCreateStatus(String workflowId, String name, String color, StatusCategory category, int pos, boolean isDef, String userId) {
        return taskStatusRepository.findByWorkflowIdOrderByPositionAsc(workflowId).stream()
                .filter(s -> s.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> taskStatusRepository.save(TaskStatus.builder()
                        .workflowId(workflowId)
                        .name(name)
                        .color(color)
                        .category(category)
                        .position(pos)
                        .isDefault(isDef)
                        .createdBy(userId)
                        .build()));
    }

    private Sprint getOrCreateSprint(String projectId, String name, String slug, String goal, SprintStatus status, LocalDateTime start, LocalDateTime end, String userId) {
        return sprintRepository.findByProjectId(projectId).stream()
                .filter(s -> s.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> sprintRepository.save(Sprint.builder()
                        .projectId(projectId)
                        .name(name)
                        .slug(slug)
                        .goal(goal)
                        .status(status)
                        .startDate(start)
                        .endDate(end)
                        .createdBy(userId)
                        .build()));
    }

    private Label getOrCreateLabel(String projectId, String name, String color, String desc, String userId) {
        return labelRepository.findByProjectId(projectId).stream()
                .filter(l -> l.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> labelRepository.save(Label.builder()
                        .projectId(projectId)
                        .name(name)
                        .color(color)
                        .description(desc)
                        .createdBy(userId)
                        .build()));
    }

    private void createSampleTask(String projectId, int taskNumber, String title, String desc, TaskType type, TaskPriority priority,
                                  String statusId, String sprintId, String createdBy, int storyPoints,
                                  LocalDateTime start, LocalDateTime due, LocalDateTime completed,
                                  List<String> assigneeIds, List<String> labelIds, String adminId, String commentText) {
        Optional<Task> existing = taskRepository.findByProjectIdAndTaskNumber(projectId, taskNumber);
        if (existing.isPresent()) return;

        String slug = "TSK-" + taskNumber;
        Task task = taskRepository.save(Task.builder()
                .projectId(projectId)
                .taskNumber(taskNumber)
                .slug(slug)
                .title(title)
                .description(desc)
                .type(type)
                .priority(priority)
                .statusId(statusId)
                .sprintId(sprintId)
                .createdBy(createdBy)
                .storyPoints(storyPoints)
                .startDate(start)
                .dueDate(due)
                .completedAt(completed)
                .build());

        // Save assignees
        if (assigneeIds != null) {
            for (String uid : assigneeIds) {
                taskAssigneeRepository.save(TaskAssignee.builder()
                        .taskId(task.getId())
                        .userId(uid)
                        .build());
            }
        }

        // Save labels
        if (labelIds != null) {
            for (String lid : labelIds) {
                taskLabelRepository.save(TaskLabel.builder()
                        .id(new TaskLabelId(task.getId(), lid))
                        .createdBy(adminId)
                        .build());
            }
        }

        // Save rank
        taskRankRepository.save(TaskRank.builder()
                .taskId(task.getId())
                .scopeType(ScopeType.PROJECT)
                .scopeId(projectId)
                .viewType(ViewType.BOARD)
                .rank((double) taskNumber)
                .build());

        // Save comment
        if (commentText != null && !commentText.isBlank()) {
            taskCommentRepository.save(TaskComment.builder()
                    .taskId(task.getId())
                    .authorId(createdBy)
                    .content(commentText)
                    .createdBy(createdBy)
                    .build());
        }
    }
}
