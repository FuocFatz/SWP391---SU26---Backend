package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.PairingContract;
import com.equix.horseracingsystem.repository.PairingContractRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@SuppressWarnings("null")
public class PairingContractService {

    private final PairingContractRepository pairingContractRepository;

    public PairingContractService(PairingContractRepository pairingContractRepository) {
        this.pairingContractRepository = pairingContractRepository;
    }

    public List<PairingContract> getAllContracts() {
        return pairingContractRepository.findAll();
    }

    public PairingContract getContractById(Long id) {
        return pairingContractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contract not found: " + id));
    }

    public PairingContract createContract(PairingContract contract) {
        return pairingContractRepository.save(contract);
    }

    public PairingContract updateContract(Long id, PairingContract contractDetails) {
        PairingContract existing = getContractById(id);
        existing.setStatus(contractDetails.getStatus());
        return pairingContractRepository.save(existing);
    }
}
