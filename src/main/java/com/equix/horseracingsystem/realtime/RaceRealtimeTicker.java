package com.equix.horseracingsystem.realtime;

import com.equix.horseracingsystem.repository.RaceRepository;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
public class RaceRealtimeTicker {

    private final RaceRepository raceRepository;
    private final RaceWorkflowService workflowService;
    private final RaceRealtimePublisher publisher;

    public RaceRealtimeTicker(RaceRepository raceRepository,
                              RaceWorkflowService workflowService,
                              RaceRealtimePublisher publisher) {
        this.raceRepository = raceRepository;
        this.workflowService = workflowService;
        this.publisher = publisher;
    }

    @Scheduled(fixedRate = 1000)
    public void publishLiveRacePositions() {
        if (!publisher.hasSubscribers()) return;
        raceRepository.findByStatus("IN_PROGRESS").stream()
                .filter(race -> race.getDeletedAt() == null)
                .forEach(race -> workflowService.simulateRace(race.getId(), null));
    }
}
