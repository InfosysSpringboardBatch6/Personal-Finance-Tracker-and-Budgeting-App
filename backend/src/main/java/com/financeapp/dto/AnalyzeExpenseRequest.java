package com.financeapp.dto;

import lombok.Data;

/**
 * Request DTO for the Analyze Expense endpoint
 */
@Data
public class AnalyzeExpenseRequest {
    private String expense;
    private Double amount;
    private String description;
}
