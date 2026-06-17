package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.service.HorseService;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/horses")
@CrossOrigin("*")
public class HorseController {

    private final HorseService service;

    public HorseController(HorseService service) {
        this.service = service;
    }

    @GetMapping
    public List<Horse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Horse getById(@PathVariable @NonNull Long id) {
        return service.getById(id);
    }

    @PostMapping
    public Horse create(@RequestBody @NonNull Horse horse) {
        return service.create(horse);
    }

    @PutMapping("/{id}")
    public Horse update(@PathVariable @NonNull Long id, @RequestBody Horse horse) {
        return service.update(id, horse);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable @NonNull Long id) {
        service.delete(id);
        return "Deleted horse id: " + id;
    }
}