package com.equix.horseracingsystem.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RaceRegistrationDeadlineScheduler {

    private final RaceWorkflowService workflowService;

    public RaceRegistrationDeadlineScheduler(RaceWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Scheduled(fixedDelayString = "${app.races.registration-scan-ms:60000}")
    public void closeExpiredRegistrations() {
        workflowService.closeExpiredRegistrations();
    }
}
