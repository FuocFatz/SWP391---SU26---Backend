package com.equix.horseracingsystem.entity;

import com.equix.horseracingsystem.enums.RewardName;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reward_types")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RewardType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 30)
    private RewardName name;

    @Column(length = 255)
    private String description;
}
