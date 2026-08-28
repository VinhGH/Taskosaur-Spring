package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.label.TaskLabelResponse;
import com.taskosaur.taskosaur.services.TaskLabelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/task-labels")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class TaskLabelController {

    private final TaskLabelService taskLabelService;

    @PostMapping
    public ResponseEntity<TaskLabelResponse> assign(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        String taskId = body.get("taskId");
        String labelId = body.get("labelId");
        TaskLabelResponse assigned = taskLabelService.assignLabel(taskId, labelId, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(assigned);
    }

    @PostMapping("/assign-multiple")
    public ResponseEntity<List<TaskLabelResponse>> assignMultiple(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        String taskId = (String) body.get("taskId");
        @SuppressWarnings("unchecked")
        List<String> labelIds = (List<String>) body.get("labelIds");
        if (labelIds != null) {
            for (String labelId : labelIds) {
                taskLabelService.assignLabel(taskId, labelId, currentUserId);
            }
        }
        return ResponseEntity.ok(taskLabelService.getLabelsByTask(taskId));
    }

    @GetMapping
    public ResponseEntity<List<TaskLabelResponse>> getTaskLabels(@RequestParam(name = "taskId") String taskId) {
        return ResponseEntity.ok(taskLabelService.getLabelsByTask(taskId));
    }

    @DeleteMapping("/{taskId}/{labelId}")
    public ResponseEntity<Void> removeLabel(
            @PathVariable String taskId,
            @PathVariable String labelId
    ) {
        taskLabelService.removeLabel(taskId, labelId);
        return ResponseEntity.noContent().build();
    }
}
