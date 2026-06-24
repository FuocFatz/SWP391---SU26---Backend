package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;

@Getter
@Setter
@Entity
@Table(name = "reward_types")
public class RewardType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Size(max = 30)
    @NotNull
    @Nationalized
    @Column(name = "name", nullable = false, length = 30)
    private String name;

    @Size(max = 255)
    @Nationalized
    @Column(name = "description")
    private String description;


}