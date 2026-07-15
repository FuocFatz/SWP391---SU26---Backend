package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.RaceNote;
import com.equix.horseracingsystem.service.RaceNoteService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/race-notes")
@CrossOrigin("*")
@PreAuthorize("hasRole('REFEREE')")
@Tag(name = "Race Notes")
public class RaceNoteController {
    private final RaceNoteService service;

    public RaceNoteController(RaceNoteService service) {
        this.service = service;
    }

    @PostMapping
    public RaceNote create(@RequestBody RaceNote note) {
        return service.createNote(note);
    }
}
