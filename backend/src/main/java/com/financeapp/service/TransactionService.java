package com.financeapp.service;

import com.financeapp.model.Transaction;
import com.financeapp.repository.TransactionRepository;
import com.financeapp.util.AiService;
import com.financeapp.util.DateFilterUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AiService aiService;

    @Autowired
    private NotificationService notificationService;

    public Map<String, Object> createTransaction(Integer userId, Map<String, Object> request) {
        Object amountObj = request.get("amount");
        Object typeObj = request.get("type");

        if (amountObj == null || typeObj == null) {
            throw new RuntimeException("Amount and type are required");
        }

        BigDecimal amount = new BigDecimal(amountObj.toString());
        Transaction.TransactionType type = Transaction.TransactionType.valueOf(typeObj.toString().toLowerCase());

        String category = (String) request.get("category");
        String description = (String) request.get("description");
        String reference = (String) request.get("reference");

        // Auto-categorize using AI if category is missing but description exists
        String finalCategory = category;
        Boolean aiCategoryUsed = false;

        if ((finalCategory == null || finalCategory.isEmpty()) && description != null && !description.isEmpty()) {
            try {
                finalCategory = aiService.getCategoryFromAI(description);
                aiCategoryUsed = true;
            } catch (Exception e) {
                finalCategory = type == Transaction.TransactionType.expense ? "Other" : "Income";
                aiCategoryUsed = true;
            }
        }

        if (finalCategory == null || finalCategory.isEmpty()) {
            throw new RuntimeException(
                    "Category is required. Please provide a description for AI categorization or enter category manually.");
        }

        // Support both 'date' and 'transaction_date' field names
        String dateStr = (String) (request.get("date") != null ? request.get("date") : request.get("transaction_date"));
        LocalDate transactionDate = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();

        Transaction transaction = new Transaction();
        transaction.setUserId(userId);
        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setCategory(finalCategory);
        transaction.setReference(reference);
        transaction.setDescription(description);
        transaction.setTransactionDate(transactionDate);

        Transaction saved = transactionRepository.save(transaction);

        // Generate notifications asynchronously
        generateNotificationsAsync(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("data", convertToMap(saved));
        if (aiCategoryUsed) {
            result.put("aiCategory", finalCategory);
        }

        return result;
    }

    @Async
    private void generateNotificationsAsync(Integer userId) {
        try {
            notificationService.generateNotificationsForUser(userId);
        } catch (Exception e) {
            System.err.println("Error generating notifications after transaction creation: " + e.getMessage());
        }
    }

    public Map<String, Object> getTransactions(Integer userId, String frequency, String type,
            String startDate, String endDate, Pageable pageable) {
        Map<String, LocalDate> dateFilters = DateFilterUtil.parseDateFilters(frequency, startDate, endDate);
        LocalDate fromDate = dateFilters.get("fromDate");
        LocalDate toDate = dateFilters.get("toDate");

        Transaction.TransactionType transactionType = null;
        if (type != null && !type.equals("all")) {
            transactionType = Transaction.TransactionType.valueOf(type.toLowerCase());
        }

        Page<Transaction> page = transactionRepository.findTransactionsWithFilters(
                userId, fromDate, toDate, transactionType, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("transactions", page.getContent().stream().map(this::convertToMap).toList());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("total", page.getTotalElements());
        pagination.put("page", page.getNumber() + 1);
        pagination.put("pageSize", page.getSize());
        pagination.put("totalPages", page.getTotalPages());
        result.put("pagination", pagination);

        return result;
    }

    public Map<String, Object> getAnalytics(Integer userId, String frequency, String type,
            String startDate, String endDate) {
        Map<String, LocalDate> dateFilters = DateFilterUtil.parseDateFilters(frequency, startDate, endDate);
        LocalDate fromDate = dateFilters.get("fromDate");
        LocalDate toDate = dateFilters.get("toDate");

        Transaction.TransactionType transactionType = null;
        if (type != null && !type.equals("all")) {
            transactionType = Transaction.TransactionType.valueOf(type.toLowerCase());
        }

        List<Transaction> transactions = transactionRepository.findTransactionsForAnalytics(
                userId, fromDate, toDate, transactionType);

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.income)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.expense)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> totals = new HashMap<>();
        totals.put("totalTransactions", transactions.size());
        totals.put("totalIncome", totalIncome);
        totals.put("totalExpense", totalExpense);

        // Category-wise stats for expenses
        Map<String, CategoryStats> expenseCategoryMap = new HashMap<>();
        for (Transaction t : transactions) {
            if (t.getType() == Transaction.TransactionType.expense) {
                expenseCategoryMap.computeIfAbsent(t.getCategory(), k -> new CategoryStats())
                        .addAmount(t.getAmount(), 1);
            }
        }

        // Category-wise stats for income
        Map<String, CategoryStats> incomeCategoryMap = new HashMap<>();
        for (Transaction t : transactions) {
            if (t.getType() == Transaction.TransactionType.income) {
                incomeCategoryMap.computeIfAbsent(t.getCategory(), k -> new CategoryStats())
                        .addAmount(t.getAmount(), 1);
            }
        }

        List<Map<String, Object>> categories = new ArrayList<>();

        // Add expense categories
        expenseCategoryMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().totalAmount.compareTo(a.getValue().totalAmount))
                .forEach(e -> {
                    Map<String, Object> cat = new HashMap<>();
                    cat.put("category", e.getKey());
                    cat.put("type", "expense");
                    cat.put("totalAmount", e.getValue().totalAmount);
                    cat.put("count", e.getValue().count);
                    categories.add(cat);
                });

        // Add income categories
        incomeCategoryMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().totalAmount.compareTo(a.getValue().totalAmount))
                .forEach(e -> {
                    Map<String, Object> cat = new HashMap<>();
                    cat.put("category", e.getKey());
                    cat.put("type", "income");
                    cat.put("totalAmount", e.getValue().totalAmount);
                    cat.put("count", e.getValue().count);
                    categories.add(cat);
                });

        Map<String, Object> result = new HashMap<>();
        result.put("totals", totals);
        result.put("categories", categories);

        return result;
    }

    private static class CategoryStats {
        BigDecimal totalAmount = BigDecimal.ZERO;
        int count = 0;

        void addAmount(BigDecimal amount, int cnt) {
            totalAmount = totalAmount.add(amount);
            count += cnt;
        }
    }

    public Map<String, Object> updateTransaction(Integer userId, Integer id, Map<String, Object> request) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!transaction.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (request.containsKey("amount")) {
            transaction.setAmount(new BigDecimal(request.get("amount").toString()));
        }
        if (request.containsKey("type")) {
            transaction.setType(Transaction.TransactionType.valueOf(request.get("type").toString().toLowerCase()));
        }
        if (request.containsKey("category")) {
            transaction.setCategory(request.get("category").toString());
        }
        if (request.containsKey("reference")) {
            transaction.setReference((String) request.get("reference"));
        }
        if (request.containsKey("description")) {
            transaction.setDescription((String) request.get("description"));
        }
        if (request.containsKey("date") || request.containsKey("transaction_date")) {
            String dateStr = (String) (request.get("date") != null ? request.get("date")
                    : request.get("transaction_date"));
            transaction.setTransactionDate(LocalDate.parse(dateStr));
        }

        Transaction updated = transactionRepository.save(transaction);

        // Generate notifications asynchronously
        generateNotificationsAsync(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("data", convertToMap(updated));
        return result;
    }

    public void deleteTransaction(Integer userId, Integer id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!transaction.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        transactionRepository.delete(transaction);

        // Generate notifications asynchronously
        generateNotificationsAsync(userId);
    }

    private Map<String, Object> convertToMap(Transaction transaction) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", transaction.getId());
        map.put("user_id", transaction.getUserId());
        map.put("type", transaction.getType().toString());
        map.put("category", transaction.getCategory());
        map.put("amount", transaction.getAmount());
        map.put("reference", transaction.getReference());
        map.put("description", transaction.getDescription());
        map.put("transaction_date", transaction.getTransactionDate().toString());
        map.put("created_at", transaction.getCreatedAt());
        map.put("updated_at", transaction.getUpdatedAt());
        return map;
    }
}
