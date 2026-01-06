package com.financeapp.controller;

import com.financeapp.dto.AnalyzeExpenseRequest;
import com.financeapp.dto.ExpenseAnalysisResponse;
import com.financeapp.dto.SmartAdvisorRequest;
import com.financeapp.service.GeminiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 Endpoints:
 - POST /api/user/ai/smart-advisor - Get personalized financial advice
 - POST /api/user/ai/analyze-expense - Categorize expense as Need or Want
 */
@RestController
@RequestMapping("/api/user/ai")
@CrossOrigin(origins = "*")
public class AIController {

    @Autowired
    private GeminiService geminiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     Smart Advisor - Get personalized financial advice
     
     @param authentication Contains the logged-in user's information
     @param request        Contains the user's query
     @return JSON with 'advice' field containing the AI response
     */
    @PostMapping("/smart-advisor")
    public ResponseEntity<Map<String, Object>> getSmartAdvice(
            Authentication authentication,
            @RequestBody SmartAdvisorRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (request.getQuery() == null || request.getQuery().trim().isEmpty()) {
                response.put("error", "Query is required");
                return ResponseEntity.badRequest().body(response);
            }

            String advice = geminiService.getSmartAdvice(request.getQuery());
            response.put("advice", advice);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("error", e.getMessage() != null ? e.getMessage() : "Failed to get advice");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     Analyze Expense - Categorize expense as Need or Want
     
     @param authentication Contains the logged-in user's information
     @param request        Contains expense details (expense, amount, description)
     @return JSON with category, confidence, reasoning, and tips
     */
    @PostMapping("/analyze-expense")
    public ResponseEntity<?> analyzeExpense(
            Authentication authentication,
            @RequestBody AnalyzeExpenseRequest request) {

        try {
            if (request.getExpense() == null || request.getAmount() == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Expense and amount are required");
                return ResponseEntity.badRequest().body(error);
            }

            String analysisJson = geminiService.analyzeExpense(
                    request.getExpense(),
                    request.getAmount(),
                    request.getDescription());

            // Parse JSON from response
            ExpenseAnalysisResponse analysis = parseAnalysisResponse(analysisJson);
            return ResponseEntity.ok(analysis);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage() != null ? e.getMessage() : "Failed to analyze expense");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     Parse the AI response to extract JSON object
     Handles cases where the AI might include extra text around the JSON
     */
    private ExpenseAnalysisResponse parseAnalysisResponse(String responseText) {
        try {
            // Try to extract JSON from the response
            Pattern pattern = Pattern.compile("\\{[\\s\\S]*\\}");
            Matcher matcher = pattern.matcher(responseText);

            if (matcher.find()) {
                String jsonString = matcher.group();
                return objectMapper.readValue(jsonString, ExpenseAnalysisResponse.class);
            } else {
                throw new RuntimeException("No JSON found in response");
            }
        } catch (Exception e) {
            // If parsing fails, return a default response
            ExpenseAnalysisResponse fallback = new ExpenseAnalysisResponse();
            fallback.setCategory("Unknown");
            fallback.setConfidence(50);
            fallback.setReasoning(responseText);
            fallback.setTips(new ArrayList<>());
            return fallback;
        }
    }
}
