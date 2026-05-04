package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.DashboardStats;
import com.nolocardeno.backend.security.CustomUserDetails;
import com.nolocardeno.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardStats> getStats(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(dashboardService.getStats(principal.getId()));
    }
}
