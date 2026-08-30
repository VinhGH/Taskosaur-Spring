package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.seeder.DatabaseSeederService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/seeder")
@RequiredArgsConstructor
public class SeederController {

    private final DatabaseSeederService seederService;

    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seedData() {
        Map<String, Object> result = seederService.seedAll();
        return ResponseEntity.ok(result);
    }
}
