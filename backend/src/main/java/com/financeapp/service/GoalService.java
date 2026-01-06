package com.financeapp.service;

import com.financeapp.model.Goal;
import com.financeapp.repository.GoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GoalService {
    
    @Autowired
    private GoalRepository goalRepository;
    
    public List<Goal> getGoals(Integer userId) {
        return goalRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public Map<String, Object> createGoal(Integer userId, Map<String, Object> request) {
        String title = (String) request.get("title");
        Object targetAmountObj = request.get("target_amount");
        
        if (title == null || title.trim().isEmpty() || targetAmountObj == null) {
            throw new RuntimeException("Title and target amount are required");
        }
        
        BigDecimal targetAmount = new BigDecimal(targetAmountObj.toString());
        if (targetAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Target amount must be a non-negative number");
        }
        
        Goal goal = new Goal();
        goal.setUserId(userId);
        goal.setTitle(title.trim());
        goal.setDescription((String) request.get("description"));
        goal.setTargetAmount(targetAmount);
        
        if (request.get("target_date") != null) {
            goal.setTargetDate(LocalDate.parse(request.get("target_date").toString()));
        }
        
        Goal saved = goalRepository.save(goal);
        
        Map<String, Object> result = new HashMap<>();
        result.put("goal", convertToMap(saved));
        result.put("message", "Goal created");
        return result;
    }
    
    public Map<String, Object> updateGoal(Integer userId, Integer id, Map<String, Object> request) {
        Goal goal = goalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Goal not found"));
        
        if (!goal.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        if (request.containsKey("title")) {
            goal.setTitle(request.get("title").toString().trim());
        }
        if (request.containsKey("description")) {
            goal.setDescription((String) request.get("description"));
        }
        if (request.containsKey("target_amount")) {
            BigDecimal targetAmount = new BigDecimal(request.get("target_amount").toString());
            if (targetAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Target amount must be non-negative");
            }
            goal.setTargetAmount(targetAmount);
        }
        if (request.containsKey("saved_amount")) {
            BigDecimal savedAmount = new BigDecimal(request.get("saved_amount").toString());
            if (savedAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Saved amount must be non-negative");
            }
            goal.setSavedAmount(savedAmount);
        }
        if (request.containsKey("target_date")) {
            Object targetDateObj = request.get("target_date");
            goal.setTargetDate(targetDateObj != null ? LocalDate.parse(targetDateObj.toString()) : null);
        }
        if (request.containsKey("status")) {
            String status = request.get("status").toString();
            goal.setStatus("completed".equals(status) ? Goal.GoalStatus.completed : Goal.GoalStatus.active);
        }
        
        Goal updated = goalRepository.save(goal);
        
        Map<String, Object> result = new HashMap<>();
        result.put("goal", convertToMap(updated));
        result.put("message", "Goal updated");
        return result;
    }
    
    public void deleteGoal(Integer userId, Integer id) {
        Goal goal = goalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Goal not found"));
        
        if (!goal.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        goalRepository.delete(goal);
    }
    
    private Map<String, Object> convertToMap(Goal goal) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", goal.getId());
        map.put("user_id", goal.getUserId());
        map.put("title", goal.getTitle());
        map.put("description", goal.getDescription());
        map.put("target_amount", goal.getTargetAmount());
        map.put("saved_amount", goal.getSavedAmount());
        map.put("target_date", goal.getTargetDate() != null ? goal.getTargetDate().toString() : null);
        map.put("status", goal.getStatus().toString());
        map.put("created_at", goal.getCreatedAt());
        map.put("updated_at", goal.getUpdatedAt());
        return map;
    }
}

