package com.financeapp.controller;

import com.financeapp.model.Budget;
import com.financeapp.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/budgets")
@CrossOrigin(origins = "*")
public class BudgetController {
    
    @Autowired
    private BudgetService budgetService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getBudgets(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            List<Budget> budgets = budgetService.getBudgets(userId);
            
            response.put("success", true);
            response.put("budgets", budgets.stream().map(this::convertToMap).toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrUpdateBudget(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Map<String, Object> result = budgetService.createOrUpdateBudget(userId, request);
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
    public ResponseEntity<Map<String, Object>> updateBudget(
            Authentication authentication,
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Map<String, Object> result = budgetService.updateBudget(userId, id, request);
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
    public ResponseEntity<Map<String, Object>> deleteBudget(
            Authentication authentication,
            @PathVariable Integer id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            budgetService.deleteBudget(userId, id);
            response.put("success", true);
            response.put("message", "Budget removed");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(e.getMessage().contains("not found") ? 404 : 400).body(response);
        }
    }
    
    private Map<String, Object> convertToMap(Budget budget) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", budget.getId());
        map.put("user_id", budget.getUserId());
        map.put("category", budget.getCategory());
        map.put("amount", budget.getAmount());
        map.put("created_at", budget.getCreatedAt());
        map.put("updated_at", budget.getUpdatedAt());
        return map;
    }
}

