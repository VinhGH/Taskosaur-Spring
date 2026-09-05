package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.label.CreateLabelRequest;
import com.taskosaur.taskosaur.models.Label;
import com.taskosaur.taskosaur.services.LabelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/labels")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class LabelController {

    private final LabelService labelService;

    @PostMapping
    public ResponseEntity<Label> create(
            @Valid @RequestBody CreateLabelRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        Label created = labelService.createLabel(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Label>> getLabels(@RequestParam(name = "projectId") String projectId) {
        return ResponseEntity.ok(labelService.getLabelsByProject(projectId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Label>> search(
            @RequestParam(name = "projectId") String projectId,
            @RequestParam(name = "q", defaultValue = "") String query
    ) {
        return ResponseEntity.ok(labelService.searchLabels(projectId, query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Label> getById(@PathVariable String id) {
        return ResponseEntity.ok(labelService.getLabelById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Label> update(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        Label updated = labelService.updateLabel(id, body, currentUserId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        labelService.deleteLabel(id);
        return ResponseEntity.noContent().build();
    }
}
