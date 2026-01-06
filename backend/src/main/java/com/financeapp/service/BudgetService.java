package com.financeapp.service;

import com.financeapp.model.Budget;
import com.financeapp.repository.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BudgetService {
    
    @Autowired
    private BudgetRepository budgetRepository;
    
    public List<Budget> getBudgets(Integer userId) {
        return budgetRepository.findByUserIdOrderByCategoryAsc(userId);
    }
    
    public Map<String, Object> createOrUpdateBudget(Integer userId, Map<String, Object> request) {
        String category = (String) request.get("category");
        Object amountObj = request.get("amount");
        
        if (category == null || category.trim().isEmpty() || amountObj == null) {
            throw new RuntimeException("Category and amount are required");
        }
        
        String normalizedCategory = category.trim();
        BigDecimal amount = new BigDecimal(amountObj.toString());
        
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Amount must be a non-negative number");
        }
        
        Optional<Budget> existingOpt = budgetRepository.findByUserIdAndCategory(userId, normalizedCategory);
        
        if (existingOpt.isPresent()) {
            Budget budget = existingOpt.get();
            budget.setAmount(amount);
            Budget updated = budgetRepository.save(budget);
            
            Map<String, Object> result = new HashMap<>();
            result.put("budget", convertToMap(updated));
            result.put("message", "Budget updated");
            return result;
        } else {
            Budget budget = new Budget();
            budget.setUserId(userId);
            budget.setCategory(normalizedCategory);
            budget.setAmount(amount);
            Budget saved = budgetRepository.save(budget);
            
            Map<String, Object> result = new HashMap<>();
            result.put("budget", convertToMap(saved));
            result.put("message", "Budget added");
            return result;
        }
    }
    
    public Map<String, Object> updateBudget(Integer userId, Integer id, Map<String, Object> request) {
        Budget budget = budgetRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Budget not found"));
        
        if (!budget.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        if (request.containsKey("category")) {
            budget.setCategory(request.get("category").toString().trim());
        }
        
        if (request.containsKey("amount")) {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            if (amount.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Amount must be non-negative number");
            }
            budget.setAmount(amount);
        }
        
        Budget updated = budgetRepository.save(budget);
        
        Map<String, Object> result = new HashMap<>();
        result.put("budget", convertToMap(updated));
        return result;
    }
    
    public void deleteBudget(Integer userId, Integer id) {
        Budget budget = budgetRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Budget not found"));
        
        if (!budget.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        budgetRepository.delete(budget);
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

