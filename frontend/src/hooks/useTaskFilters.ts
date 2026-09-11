import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { CheckSquare, Flame, Shapes, User, Users, Zap } from "lucide-react";
import { TaskPriorities, TaskTypeIcon } from "@/utils/data/taskData";
import { useGenericFilters } from "@/components/common/FilterDropdown";

interface UseTaskFiltersOptions {
  tasks: any[];
  availableStatuses: any[];
  availablePriorities?: any[];
  availableSprints: any[];
  projectMembers: any[];
  onPageReset?: () => void;
}

export function useTaskFilters({
  tasks,
  availableStatuses,
  availablePriorities = TaskPriorities,
  availableSprints,
  projectMembers,
  onPageReset,
}: UseTaskFiltersOptions) {
  const { t } = useTranslation("tasks");
  const router = useRouter();
  const { createSection } = useGenericFilters();

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<string[]>([]);
  const [selectedSprints, setSelectedSprints] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedReporters, setSelectedReporters] = useState<string[]>([]);

  // Initialize filters from URL query params
  useEffect(() => {
    if (router.isReady) {
      const { sprints, statuses, priorities, types, assignees, reporters } = router.query;
      if (sprints) setSelectedSprints(Array.isArray(sprints) ? sprints : sprints.split(","));
      if (statuses) setSelectedStatuses(Array.isArray(statuses) ? statuses : statuses.split(","));
      if (priorities) setSelectedPriorities(Array.isArray(priorities) ? priorities : priorities.split(","));
      if (types) setSelectedTaskTypes(Array.isArray(types) ? types : types.split(","));
      if (assignees) setSelectedAssignees(Array.isArray(assignees) ? assignees : assignees.split(","));
      if (reporters) setSelectedReporters(Array.isArray(reporters) ? reporters : reporters.split(","));
    }
  }, [router.isReady]);

  const statusFilters = useMemo(
    () =>
      availableStatuses.map((status) => ({
        id: status.id,
        name: status.name,
        value: status.id,
        selected: selectedStatuses.includes(status.id),
        count: Array.isArray(tasks) ? tasks.filter((task) => task.statusId === status.id).length : 0,
        color: status.color || "#6b7280",
      })),
    [availableStatuses, selectedStatuses, tasks]
  );

  const priorityFilters = useMemo(
    () =>
      availablePriorities.map((priority) => ({
        id: priority.id,
        name: priority.name,
        value: priority.value,
        selected: selectedPriorities.includes(priority.value),
        count: Array.isArray(tasks) ? tasks.filter((task) => task.priority === priority.value).length : 0,
        color: priority.color,
      })),
    [availablePriorities, selectedPriorities, tasks]
  );

  const taskTypeFilters = useMemo(
    () =>
      Object.keys(TaskTypeIcon).map((type) => {
        const typeKey = type as keyof typeof TaskTypeIcon;
        const iconData = TaskTypeIcon[typeKey];
        return {
          id: type,
          name: type.charAt(0) + type.slice(1).toLowerCase(),
          value: type,
          selected: selectedTaskTypes.includes(type),
          count: Array.isArray(tasks) ? tasks.filter((task) => task.type === type).length : 0,
          color: iconData?.color || "text-gray-500",
        };
      }),
    [selectedTaskTypes, tasks]
  );

  const sprintFilters = useMemo(
    () =>
      availableSprints.map((sprint) => ({
        id: sprint.id,
        name: sprint.name,
        value: sprint.id,
        selected: selectedSprints.includes(sprint.id),
        count: Array.isArray(tasks) ? tasks.filter((task) => task.sprintId === sprint.id).length : 0,
        color: sprint.status === "ACTIVE" ? "#10b981" : "#6b7280",
      })),
    [availableSprints, selectedSprints, tasks]
  );

  const assigneeFilters = useMemo(() => {
    return projectMembers.map((member) => ({
      id: member.user.id,
      name: member?.user?.firstName + " " + member.user.lastName,
      value: member?.user.id,
      selected: selectedAssignees.includes(member.user.id),
      count: Array.isArray(tasks)
        ? tasks.filter((task) =>
          Array.isArray(task.assignees)
            ? task.assignees.some((assignee: any) => assignee.id === member.user.id)
            : false
        ).length
        : 0,
      email: member?.user?.email,
    }));
  }, [projectMembers, selectedAssignees, tasks]);

  const reporterFilters = useMemo(() => {
    return projectMembers.map((member) => ({
      id: member.user.id,
      name: member?.user?.firstName + " " + member.user.lastName,
      value: member?.user.id,
      selected: selectedReporters.includes(member.user.id),
      count: Array.isArray(tasks)
        ? tasks.filter((task) =>
          Array.isArray(task.reporters)
            ? task.reporters.some((reporter: any) => reporter.id === member.user.id)
            : false
        ).length
        : 0,
      email: member?.user?.email,
    }));
  }, [projectMembers, selectedReporters, tasks]);

  const toggleStatus = useCallback(
    (id: string) => {
      setSelectedStatuses((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      onPageReset?.();
    },
    [onPageReset]
  );

  const togglePriority = useCallback(
    (id: string) => {
      setSelectedPriorities((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      onPageReset?.();
    },
    [onPageReset]
  );

  const toggleTaskType = useCallback(
    (id: string) => {
      setSelectedTaskTypes((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      onPageReset?.();
    },
    [onPageReset]
  );

  const toggleSprint = useCallback(
    (id: string) => {
      setSelectedSprints((prev) => {
        const newSelection = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        const newQuery = { ...router.query };
        if (newSelection.length > 0) {
          newQuery.sprints = newSelection.join(",");
        } else {
          delete newQuery.sprints;
        }
        router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
        return newSelection;
      });
      onPageReset?.();
    },
    [onPageReset, router]
  );

  const toggleAssignee = useCallback(
    (id: string) => {
      setSelectedAssignees((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      onPageReset?.();
    },
    [onPageReset]
  );

  const toggleReporter = useCallback(
    (id: string) => {
      setSelectedReporters((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      onPageReset?.();
    },
    [onPageReset]
  );

  const clearAllFilters = useCallback(() => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedTaskTypes([]);
    setSelectedSprints([]);
    setSelectedAssignees([]);
    setSelectedReporters([]);
    onPageReset?.();
  }, [onPageReset]);

  const filterSections = useMemo(
    () => [
      createSection({
        id: "status",
        title: t("filters.status"),
        icon: CheckSquare,
        data: statusFilters,
        selectedIds: selectedStatuses,
        searchable: false,
        onToggle: toggleStatus,
        onSelectAll: () => setSelectedStatuses(statusFilters.map((s) => s.id)),
        onClearAll: () => setSelectedStatuses([]),
      }),
      createSection({
        id: "priority",
        title: t("filters.priority"),
        icon: Flame,
        data: priorityFilters,
        selectedIds: selectedPriorities,
        searchable: false,
        onToggle: togglePriority,
        onSelectAll: () => setSelectedPriorities(priorityFilters.map((p) => p.id)),
        onClearAll: () => setSelectedPriorities([]),
      }),
      createSection({
        id: "type",
        title: t("filters.type"),
        icon: Shapes,
        data: taskTypeFilters,
        selectedIds: selectedTaskTypes,
        searchable: false,
        onToggle: toggleTaskType,
        onSelectAll: () => setSelectedTaskTypes(taskTypeFilters.map((t) => t.id)),
        onClearAll: () => setSelectedTaskTypes([]),
      }),
      createSection({
        id: "sprint",
        title: t("filters.sprint"),
        icon: Zap,
        data: sprintFilters,
        selectedIds: selectedSprints,
        searchable: true,
        onToggle: toggleSprint,
        onSelectAll: () => {
          const allValues = sprintFilters.map((s) => s.id);
          setSelectedSprints(allValues);
          const newQuery = { ...router.query, sprints: allValues.join(",") };
          router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
        },
        onClearAll: () => {
          setSelectedSprints([]);
          const newQuery = { ...router.query };
          delete newQuery.sprints;
          router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
        },
      }),
      createSection({
        id: "assignee",
        title: t("filters.assignee"),
        icon: User,
        data: assigneeFilters,
        selectedIds: selectedAssignees,
        searchable: true,
        onToggle: toggleAssignee,
        onSelectAll: () => setSelectedAssignees(assigneeFilters.map((a) => a.id)),
        onClearAll: () => setSelectedAssignees([]),
      }),
      createSection({
        id: "reporter",
        title: t("filters.reporter"),
        icon: Users,
        data: reporterFilters,
        selectedIds: selectedReporters,
        searchable: true,
        onToggle: toggleReporter,
        onSelectAll: () => setSelectedReporters(reporterFilters.map((r) => r.id)),
        onClearAll: () => setSelectedReporters([]),
      }),
    ],
    [
      priorityFilters,
      taskTypeFilters,
      sprintFilters,
      statusFilters,
      assigneeFilters,
      reporterFilters,
      selectedStatuses,
      selectedPriorities,
      selectedTaskTypes,
      selectedSprints,
      selectedAssignees,
      selectedReporters,
      toggleAssignee,
      toggleReporter,
      toggleStatus,
      togglePriority,
      toggleTaskType,
      toggleSprint,
      createSection,
      router,
      t,
    ]
  );

  const totalActiveFilters =
    selectedStatuses.length +
    selectedPriorities.length +
    selectedTaskTypes.length +
    selectedSprints.length +
    selectedAssignees.length +
    selectedReporters.length;

  return {
    selectedStatuses,
    setSelectedStatuses,
    selectedPriorities,
    setSelectedPriorities,
    selectedTaskTypes,
    setSelectedTaskTypes,
    selectedSprints,
    setSelectedSprints,
    selectedAssignees,
    setSelectedAssignees,
    selectedReporters,
    setSelectedReporters,
    statusFilters,
    priorityFilters,
    taskTypeFilters,
    sprintFilters,
    assigneeFilters,
    reporterFilters,
    toggleStatus,
    togglePriority,
    toggleTaskType,
    toggleSprint,
    toggleAssignee,
    toggleReporter,
    clearAllFilters,
    filterSections,
    totalActiveFilters,
  };
}
