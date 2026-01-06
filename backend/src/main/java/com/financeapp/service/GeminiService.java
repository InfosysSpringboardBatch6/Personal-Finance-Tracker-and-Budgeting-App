package com.financeapp.service;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for interacting with Google Gemini AI
 * 
 * This service provides methods to:
 * 1. Get personalized financial advice (Smart Advisor)
 * 2. Analyze expenses as Needs vs Wants
 */
@Service
public class GeminiService {

        private final Client client;

        public GeminiService(@Value("${gemini.api-key}") String apiKey) {
                // Build client with API key from application.properties/.env
                this.client = Client.builder()
                                .apiKey(apiKey)
                                .build();
        }

        /**
         * Get financial advice from Gemini AI
         * 
         * @param query The user's financial question
         * @return AI-generated financial advice
         */
        public String getSmartAdvice(String query) throws Exception {
                String systemInstruction = """
                                You are a friendly, expert financial advisor AI assistant. Your role is to provide personalized, actionable financial advice.

                                Guidelines:
                                - Be encouraging and supportive, not judgmental
                                - Provide specific, actionable advice
                                - Use simple language, avoid jargon
                                - Consider the user's financial context when provided
                                - Suggest realistic steps they can take today
                                - Mention relevant financial concepts when helpful
                                - Be concise but thorough

                                Areas of expertise:
                                - Budgeting and expense management
                                - Saving strategies (emergency fund, goals)
                                - Debt management and payoff strategies
                                - Investment basics
                                - Retirement planning
                                - Tax optimization tips
                                - Smart spending habits

                                Format your response with:
                                - A direct answer to their question
                                - 2-3 actionable tips
                                - A motivational note when appropriate
                                """;

                GenerateContentConfig config = GenerateContentConfig.builder()
                                .systemInstruction(Content.fromParts(Part.fromText(systemInstruction)))
                                .build();

                GenerateContentResponse response = client.models.generateContent(
                                "gemini-2.5-flash",
                                query,
                                config);

                return response.text();
        }

        /**
         * Analyze an expense and categorize as Need or Want
         * 
         * @param expense     The expense name/item
         * @param amount      The expense amount
         * @param description Additional context about the expense
         * @return JSON string with analysis results
         */
        public String analyzeExpense(String expense, Double amount, String description) throws Exception {
                String systemInstruction = """
                                You are a financial advisor AI that analyzes expenses and categorizes them as "Need" or "Want".

                                A "Need" is an essential expense required for survival, safety, or basic functioning:
                                - Housing (rent, mortgage, utilities)
                                - Food and groceries (basic necessities)
                                - Healthcare and medicine
                                - Transportation to work
                                - Basic clothing
                                - Insurance (health, home, auto)
                                - Debt payments

                                A "Want" is a non-essential expense that improves quality of life but isn't necessary:
                                - Entertainment (streaming, games, concerts)
                                - Dining out
                                - Luxury items
                                - Vacations
                                - Premium services
                                - Fashion beyond basics
                                - Hobbies

                                Respond ONLY with valid JSON in this exact format:
                                {
                                  "category": "Need" or "Want",
                                  "confidence": 0-100,
                                  "reasoning": "Brief explanation",
                                  "tips": ["Tip 1", "Tip 2"]
                                }
                                """;

                String userMessage = String.format("""
                                Analyze this expense:
                                Item: %s
                                Amount: $%.2f
                                Additional context: %s

                                Respond with ONLY the JSON object, no other text.
                                """, expense, amount, description != null ? description : "None provided");

                GenerateContentConfig config = GenerateContentConfig.builder()
                                .systemInstruction(Content.fromParts(Part.fromText(systemInstruction)))
                                .build();

                GenerateContentResponse response = client.models.generateContent(
                                "gemini-2.5-flash",
                                userMessage,
                                config);

                return response.text();
        }
}
