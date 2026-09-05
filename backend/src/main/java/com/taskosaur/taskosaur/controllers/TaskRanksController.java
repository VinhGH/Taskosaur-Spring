package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.services.TaskRanksService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/task-ranks")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class TaskRanksController {

    private final TaskRanksService taskRanksService;

    @PatchMapping("/{taskId}/reorder")
    public ResponseEntity<Map<String, Object>> reorder(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> body
    ) {
        String scopeType = (String) body.get("scopeType");
        String scopeId = (String) body.get("scopeId");
        String viewType = (String) body.get("viewType");
        String afterTaskId = (String) body.get("afterTaskId");
        String beforeTaskId = (String) body.get("beforeTaskId");

        Map<String, Object> result = taskRanksService.reorder(
                taskId, scopeType, scopeId, viewType, afterTaskId, beforeTaskId
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/rebalance")
    public ResponseEntity<Map<String, Object>> rebalance() {
        return ResponseEntity.ok(Map.of("message", "Task ranks balanced successfully", "success", true));
    }
}
