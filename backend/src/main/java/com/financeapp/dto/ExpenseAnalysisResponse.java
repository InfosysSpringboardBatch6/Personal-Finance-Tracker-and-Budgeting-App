package com.financeapp.dto;

import lombok.Data;
import java.util.List;

/**
 * Response DTO for the Analyze Expense endpoint
 */
@Data
public class ExpenseAnalysisResponse {
    private String category;
    private Integer confidence;
    private String reasoning;
    private List<String> tips;
}
