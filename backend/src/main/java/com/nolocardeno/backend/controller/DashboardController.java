package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.DashboardStats;
import com.nolocardeno.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardStats> getStats(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(dashboardService.getStats(userId));
    }
}
