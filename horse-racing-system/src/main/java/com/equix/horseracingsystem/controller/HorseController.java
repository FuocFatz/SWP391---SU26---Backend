package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.HorseService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/horses")
public class HorseController {

    private final HorseService service;
    private final UserRepository userRepository;

    public HorseController(HorseService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Horse> getAll() {
        return service.getAll();
    }

    @GetMapping("/owner/{ownerId}")
    public List<Horse> getByOwner(@PathVariable Long ownerId, Principal principal) {
        User actor = actor(principal);
        if (!"ADMIN".equals(actor.getRole()) && !actor.getId().equals(ownerId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only view your own stable");
        }
        return service.getByOwner(ownerId);
    }

    @GetMapping("/{id}")
    public Horse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('HORSE_OWNER')")
    @ResponseStatus(HttpStatus.CREATED)
    public Horse create(@RequestBody Horse horse, Principal principal) {
        horse.setId(null);
        horse.setOwnerId(actor(principal).getId());
        return service.create(horse);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HORSE_OWNER','ADMIN')")
    public Horse update(@PathVariable Long id, @RequestBody Horse horse, Principal principal) {
        assertOwnerOrAdmin(service.getById(id), actor(principal));
        return service.update(id, horse);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HORSE_OWNER','ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Principal principal) {
        assertOwnerOrAdmin(service.getById(id), actor(principal));
        service.delete(id);
    }

    private User actor(Principal principal) {
        return userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
    }

    private void assertOwnerOrAdmin(Horse horse, User actor) {
        if (!"ADMIN".equals(actor.getRole()) && !actor.getId().equals(horse.getOwnerId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only modify horses in your own stable");
        }
    }
}
