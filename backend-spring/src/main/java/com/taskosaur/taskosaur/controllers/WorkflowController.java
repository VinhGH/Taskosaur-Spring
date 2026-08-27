package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.models.Workflow;
import com.taskosaur.taskosaur.services.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping("/{id}")
    public ResponseEntity<Workflow> getById(@PathVariable String id) {
        return ResponseEntity.ok(workflowService.getWorkflowById(id));
    }

    @GetMapping("/{id}/statuses")
    public ResponseEntity<List<TaskStatus>> getStatuses(@PathVariable String id) {
        return ResponseEntity.ok(workflowService.getWorkflowStatuses(id));
    }
}
