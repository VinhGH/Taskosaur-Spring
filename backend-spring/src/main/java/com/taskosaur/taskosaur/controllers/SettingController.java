package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.setting.BulkSetSettingsRequest;
import com.taskosaur.taskosaur.dto.setting.SetSettingRequest;
import com.taskosaur.taskosaur.dto.setting.SettingResponse;
import com.taskosaur.taskosaur.services.SettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class SettingController {

    private final SettingService settingService;

    @GetMapping
    public ResponseEntity<List<SettingResponse>> getAllSettings(
            Authentication authentication,
            @RequestParam(name = "category", required = false) String category
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(settingService.getAll(userId, category));
    }

    @GetMapping("/{key}")
    public ResponseEntity<Map<String, String>> getSetting(
            Authentication authentication,
            @PathVariable String key,
            @RequestParam(name = "defaultValue", required = false) String defaultValue
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        String value = settingService.get(key, userId, defaultValue);
        return ResponseEntity.ok(Map.of("key", key, "value", value != null ? value : ""));
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> setSetting(
            Authentication authentication,
            @Valid @RequestBody SetSettingRequest request
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        settingService.set(
                request.getKey(),
                request.getValue(),
                userId,
                request.getDescription(),
                request.getCategory(),
                request.getIsEncrypted()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Setting updated successfully"));
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, String>> bulkSetSettings(
            Authentication authentication,
            @Valid @RequestBody BulkSetSettingsRequest request
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        settingService.bulkSet(request.getSettings(), userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Settings updated successfully"));
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<Map<String, String>> deleteSetting(
            Authentication authentication,
            @PathVariable String key
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        settingService.delete(key, userId);
        return ResponseEntity.ok(Map.of("message", "Setting deleted successfully"));
    }
}
