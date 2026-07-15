package com.equix.horseracingsystem.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
@CrossOrigin("*")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Logs", description = "System audit trail")
public class AuditLogController {
    @GetMapping
    public List<Object> getAll() {
        return List.of();
    }
}
