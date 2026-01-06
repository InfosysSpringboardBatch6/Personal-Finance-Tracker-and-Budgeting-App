package com.financeapp.service;

import com.financeapp.model.Notification;
import com.financeapp.model.Transaction;
import com.financeapp.model.Budget;
import com.financeapp.model.Goal;
import com.financeapp.repository.NotificationRepository;
import com.financeapp.repository.TransactionRepository;
import com.financeapp.repository.BudgetRepository;
import com.financeapp.repository.GoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private BudgetRepository budgetRepository;
    
    @Autowired
    private GoalRepository goalRepository;
    
    public int generateNotificationsForUser(Integer userId) {
        List<Map<String, Object>> suggestions = generateSuggestions(userId);
        int newCount = 0;
        
        for (Map<String, Object> suggestion : suggestions) {
            String message = (String) suggestion.get("message");
            Notification.NotificationType type = (Notification.NotificationType) suggestion.get("type");
            
            // Check for duplicates (within last 24 hours)
            LocalDateTime threshold = LocalDateTime.now().minusHours(24);
            List<Notification> existing = notificationRepository.findDuplicateNotifications(
                userId, message, threshold);
            
            if (existing.isEmpty()) {
                Notification notification = new Notification();
                notification.setUserId(userId);
                notification.setMessage(message);
                notification.setType(type);
                notification.setIsRead(false);
                notificationRepository.save(notification);
                newCount++;
            }
        }
        
        // Keep only the 5 most recent notifications
        List<Notification> allNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (allNotifications.size() > 5) {
            List<Notification> toDelete = allNotifications.subList(5, allNotifications.size());
            notificationRepository.deleteAll(toDelete);
        }
        
        return newCount;
    }
    
    private List<Map<String, Object>> generateSuggestions(Integer userId) {
        List<Map<String, Object>> suggestions = new ArrayList<>();
        LocalDate now = LocalDate.now();
        LocalDate thirtyDaysAgo = now.minusDays(30);
        
        // Get transactions for last 30 days
        List<Transaction> transactions = transactionRepository.findTransactionsForAnalytics(
            userId, thirtyDaysAgo, now, null);
        
        BigDecimal totalIncome = transactions.stream()
            .filter(t -> t.getType() == Transaction.TransactionType.income)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalExpense = transactions.stream()
            .filter(t -> t.getType() == Transaction.TransactionType.expense)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal savings = totalIncome.subtract(totalExpense);
        double savingsRate = totalIncome.compareTo(BigDecimal.ZERO) > 0
            ? savings.divide(totalIncome, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100")).doubleValue()
            : 0;
        
        // Rule 1: Savings rate check
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            if (savingsRate >= 20) {
                suggestions.add(createSuggestion(
                    String.format("Your savings rate is good! You're saving %.1f%% of your income.", savingsRate),
                    Notification.NotificationType.success));
            } else if (savingsRate < 10) {
                suggestions.add(createSuggestion(
                    String.format("Try to save at least 20%% of your income. Currently you're saving %.1f%%.", savingsRate),
                    Notification.NotificationType.warning));
            } else if (savingsRate < 0) {
                suggestions.add(createSuggestion(
                    "You're spending more than you earn. Try to reduce expenses or increase income.",
                    Notification.NotificationType.warning));
            }
        }
        
        // Rule 2: Category-wise spending analysis
        Map<String, BigDecimal> categoryTotals = transactions.stream()
            .filter(t -> t.getType() == Transaction.TransactionType.expense)
            .collect(Collectors.groupingBy(
                Transaction::getCategory,
                Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)));
        
        if (!categoryTotals.isEmpty() && totalExpense.compareTo(BigDecimal.ZERO) > 0) {
            String highestCategory = categoryTotals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
            
            if (highestCategory != null) {
                BigDecimal categoryAmount = categoryTotals.get(highestCategory);
                double categoryPercentage = categoryAmount.divide(totalExpense, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).doubleValue();
                
                List<String> commonCategories = Arrays.asList("Food", "Entertainment", "Shopping", "Transportation");
                
                if (categoryPercentage > 40 && commonCategories.contains(highestCategory)) {
                    suggestions.add(createSuggestion(
                        String.format("You are spending too much on %s. Consider reducing expenses in this category.", highestCategory),
                        Notification.NotificationType.warning));
                } else if (categoryPercentage > 30 && totalExpense.compareTo(new BigDecimal("10000")) > 0) {
                    suggestions.add(createSuggestion(
                        String.format("Your spending on %s is high (%.1f%% of total expenses).", highestCategory, categoryPercentage),
                        Notification.NotificationType.tip));
                }
            }
        }
        
        // Rule 3: Weekend spending analysis
        List<Transaction> expenseTransactions = transactions.stream()
            .filter(t -> t.getType() == Transaction.TransactionType.expense)
            .toList();
        
        long weekendCount = expenseTransactions.stream()
            .filter(t -> {
                DayOfWeek dayOfWeek = t.getTransactionDate().getDayOfWeek();
                return dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY;
            })
            .count();
        
        long weekdayCount = expenseTransactions.size() - weekendCount;
        
        if (weekendCount > 0 && weekdayCount > 0) {
            BigDecimal weekendTotal = expenseTransactions.stream()
                .filter(t -> {
                    DayOfWeek dayOfWeek = t.getTransactionDate().getDayOfWeek();
                    return dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY;
                })
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal weekdayTotal = totalExpense.subtract(weekendTotal);
            
            BigDecimal weekendAvg = weekendTotal.divide(new BigDecimal(weekendCount), 2, RoundingMode.HALF_UP);
            BigDecimal weekdayAvg = weekdayTotal.divide(new BigDecimal(weekdayCount), 2, RoundingMode.HALF_UP);
            
            if (weekdayAvg.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal ratio = weekendAvg.divide(weekdayAvg, 2, RoundingMode.HALF_UP);
                BigDecimal thirtyPercent = totalExpense.multiply(new BigDecimal("0.3"));
                
                if (ratio.compareTo(new BigDecimal("1.5")) > 0 && weekendTotal.compareTo(thirtyPercent) > 0) {
                    suggestions.add(createSuggestion(
                        "Reduce weekend spending. Your weekend expenses are significantly higher than weekdays.",
                        Notification.NotificationType.tip));
                }
            }
        }
        
        // Rule 4: Goals check
        List<Goal> activeGoals = goalRepository.findByUserIdAndStatus(userId, Goal.GoalStatus.active);
        if (!activeGoals.isEmpty()) {
            BigDecimal totalGoalsAmount = activeGoals.stream()
                .map(Goal::getTargetAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalSavedForGoals = activeGoals.stream()
                .map(Goal::getSavedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            if (totalGoalsAmount.compareTo(BigDecimal.ZERO) > 0) {
                double goalsProgress = totalSavedForGoals.divide(totalGoalsAmount, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).doubleValue();
                
                if (goalsProgress < 50 && savingsRate > 15) {
                    suggestions.add(createSuggestion(
                        "You have active goals. Consider allocating more savings towards them.",
                        Notification.NotificationType.info));
                }
            }
        }
        
        // Rule 5: Budget check
        List<Budget> budgets = budgetRepository.findByUserIdOrderByCategoryAsc(userId);
        if (!budgets.isEmpty()) {
            for (Budget budget : budgets) {
                BigDecimal spent = categoryTotals.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
                if (budget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal excess = spent.subtract(budget.getAmount());
                    if (excess.compareTo(BigDecimal.ZERO) > 0) {
                        double excessPercentage = excess.divide(budget.getAmount(), 4, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal("100")).doubleValue();
                        
                        if (excessPercentage > 10) {
                            suggestions.add(createSuggestion(
                                String.format("You've exceeded your budget for %s by %.1f%%.", 
                                    budget.getCategory(), excessPercentage),
                                Notification.NotificationType.warning));
                        }
                    }
                }
            }
        }
        
        return suggestions;
    }
    
    private Map<String, Object> createSuggestion(String message, Notification.NotificationType type) {
        Map<String, Object> suggestion = new HashMap<>();
        suggestion.put("message", message);
        suggestion.put("type", type);
        return suggestion;
    }
    
    public List<Notification> getNotifications(Integer userId, Boolean unreadOnly) {
        if (unreadOnly != null && unreadOnly) {
            return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        }
        return notificationRepository.findTop6ByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public void markAsRead(Integer userId, Integer id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
    
    public void markAllAsRead(Integer userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        for (Notification notification : unread) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
    }
}

