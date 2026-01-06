package com.financeapp.repository;

import com.financeapp.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Integer> {
    List<Goal> findByUserIdOrderByCreatedAtDesc(Integer userId);
    List<Goal> findByUserIdAndStatus(Integer userId, Goal.GoalStatus status);
}

