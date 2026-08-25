package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.organization.OrganizationResponse;
import com.taskosaur.taskosaur.services.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organization-members")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class OrganizationMemberController {

    private final OrganizationService organizationService;

    @GetMapping("/user/{userId}/organizations")
    public ResponseEntity<List<OrganizationResponse>> getUserOrganizations(@PathVariable String userId) {
        List<OrganizationResponse> organizations = organizationService.getUserOrganizations(userId);
        return ResponseEntity.ok(organizations);
    }
}
