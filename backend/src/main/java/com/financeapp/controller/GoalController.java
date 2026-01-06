package com.financeapp.controller;

import com.financeapp.model.Goal;
import com.financeapp.service.GoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/goals")
@CrossOrigin(origins = "*")
public class GoalController {
    
    @Autowired
    private GoalService goalService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getGoals(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            List<Goal> goals = goalService.getGoals(userId);
            
            response.put("success", true);
            response.put("goals", goals.stream().map(this::convertToMap).toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createGoal(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Map<String, Object> result = goalService.createGoal(userId, request);
            response.put("success", true);
            response.putAll(result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateGoal(
            Authentication authentication,
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Map<String, Object> result = goalService.updateGoal(userId, id, request);
            response.put("success", true);
            response.putAll(result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(e.getMessage().contains("not found") ? 404 : 400).body(response);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteGoal(
            Authentication authentication,
            @PathVariable Integer id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            goalService.deleteGoal(userId, id);
            response.put("success", true);
            response.put("message", "Goal removed");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(e.getMessage().contains("not found") ? 404 : 400).body(response);
        }
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

