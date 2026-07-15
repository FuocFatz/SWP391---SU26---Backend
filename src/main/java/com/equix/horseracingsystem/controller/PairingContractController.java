package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.PairingContract;
import com.equix.horseracingsystem.service.PairingContractService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/pairing-contracts")
@CrossOrigin("*")
@Tag(name = "Pairing Contracts")
public class PairingContractController {
    private final PairingContractService service;

    public PairingContractController(PairingContractService service) {
        this.service = service;
    }

    @GetMapping
    public List<PairingContract> getAll() {
        return service.getAllContracts();
    }

    @PutMapping("/{id}/dissolve")
    public PairingContract dissolve(@PathVariable Long id) {
        PairingContract contract = service.getContractById(id);
        contract.setStatus(com.equix.horseracingsystem.enums.PairingContractStatus.DISSOLVED);
        contract.setDissolvedAt(LocalDateTime.now());
        return service.updateContract(id, contract);
    }
}
