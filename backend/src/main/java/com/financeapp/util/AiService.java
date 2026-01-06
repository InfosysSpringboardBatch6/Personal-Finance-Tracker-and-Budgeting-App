package com.financeapp.util;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * AI-powered Transaction Categorization Service
 * 
 * This service automatically categorizes transactions based on their
 * descriptions.
 * It uses a simple but effective keyword-matching algorithm.
 * 
 * HOW IT WORKS:
 * 1. User enters a transaction description (e.g., "Uber ride to airport")
 * 2. Service scans the description for keywords
 * 3. Each category gets a "score" based on how many keywords match
 * 4. The category with the highest score wins
 * 5. If no matches, returns "Other"
 * 
 * EXAMPLE:
 * Description: "Had lunch at Pizza Hut restaurant"
 * - "Food" category gets 3 points: "lunch", "pizza", "restaurant"
 * - Other categories get 0 points
 * - Result: "Food"
 * 
 * WHY KEYWORD MATCHING (vs Machine Learning)?
 * - Simpler to implement and understand
 * - No training data required
 * - Fast and predictable
 * - Easy to extend by adding new keywords
 * - Good enough for most personal finance applications
 * 
 * ALTERNATIVE APPROACH:
 * The Node.js backend uses Naive Bayes classifier from the 'natural' library
 * which is a simple ML approach. Both achieve similar results.
 */
@Service
public class AiService {

    /**
     * Maps each category to a list of related keywords.
     * When a description contains a keyword, that category gets a point.
     * 
     * Static initializer block runs once when the class is loaded.
     */
    private static final Map<String, List<String>> CATEGORY_KEYWORDS = new HashMap<>();

    // Static block to initialize the keyword mappings
static {
    // FOOD & DINING
    CATEGORY_KEYWORDS.put("Food", Arrays.asList(
            "lunch", "dinner", "breakfast", "food", "restaurant", "cafe", "pizza",
            "coffee", "grocery", "groceries", "supermarket", "takeout", "delivery",
            "uber eats", "doordash", "snacks", "bakery", "ice cream", "boba", "tea",
            "bar", "drink", "steakhouse", "burger", "fast food", "sandwich",
            "sushi", "catering", "farmers market", "produce", "pastries",
            "convenience store", "whole foods"
    ));

    // TRANSPORTATION
    CATEGORY_KEYWORDS.put("Transportation", Arrays.asList(
            "uber", "taxi", "ride", "gas", "fuel", "parking", "bus", "train", "metro",
            "transport", "lyft", "rapido", "ola", "grab", "auto", "bike", "scooter",
            "airport", "toll", "maintenance", "oil", "tires", "rental car",
            "bike taxi", "bike share", "scooter rental", "car service",
            "motorcycle", "vehicle"
    ));

    // ENTERTAINMENT
    CATEGORY_KEYWORDS.put("Entertainment", Arrays.asList(
            "movie", "cinema", "netflix", "spotify", "concert", "game", "novel", "book",
            "disney", "hulu", "bowling", "arcade", "museum", "theater", "audible",
            "streaming", "subscription", "steam", "kindle", "hbo", "play",
            "ticket", "audiobooks"
    ));

    // SHOPPING
    CATEGORY_KEYWORDS.put("Shopping", Arrays.asList(
            "amazon", "mall", "shopping", "clothing", "shoes", "electronics", "store",
            "laptop", "furniture", "ikea", "decor", "gift", "sports",
            "pet", "tools", "boutique", "retail", "jeans", "target",
            "best buy", "home depot", "petco", "dicks"
    ));

    // UTILITIES
    CATEGORY_KEYWORDS.put("Utilities", Arrays.asList(
            "electric", "water", "internet", "phone", "bill", "wifi", "broadband",
            "gas bill", "trash", "sewage", "mobile data", "security system",
            "cable", "isp", "provider", "verizon", "at&t", "adt"
    ));

    // HEALTHCARE
    CATEGORY_KEYWORDS.put("Healthcare", Arrays.asList(
            "doctor", "pharmacy", "hospital", "dental", "therapy", "vaccine",
            "eye exam", "vitamins", "physical therapy", "emergency",
            "insurance", "chiropractor", "clinic", "medicine", "prescription",
            "optician", "supplements", "co-pay"
    ));

    // EDUCATION
    CATEGORY_KEYWORDS.put("Education", Arrays.asList(
            "tuition", "college", "course", "workshop", "textbook", "books",
            "learning", "student loan", "school", "stationery",
            "udemy", "bootcamp", "duolingo", "training", "seminar",
            "coding", "language", "supplies"
    ));

    // TRAVEL
    CATEGORY_KEYWORDS.put("Travel", Arrays.asList(
            "hotel", "flight", "airbnb", "vacation", "resort", "airport",
            "souvenir", "travel insurance", "visa", "baggage",
            "tour", "airline", "parking", "accommodation", "trip"
    ));

    // PERSONAL CARE
    CATEGORY_KEYWORDS.put("Personal Care", Arrays.asList(
            "gym", "fitness", "salon", "haircut", "spa", "massage", "beauty",
            "makeup", "skincare", "cosmetics", "shampoo", "yoga",
            "barber", "manicure", "pedicure", "sephora", "ulta"
    ));

    // SAVINGS & INVESTMENTS
    CATEGORY_KEYWORDS.put("Savings", Arrays.asList(
            "savings", "transfer", "investment", "stocks", "mutual fund",
            "brokerage", "vanguard", "fidelity", "etrade",
            "emergency fund", "deposit", "earned", "income",
            "buy stocks", "invest", "save", "earning"
    ));

    // BILLS & SUBSCRIPTIONS
    CATEGORY_KEYWORDS.put("Bills & Subscriptions", Arrays.asList(
            "rent", "mortgage", "insurance", "premium", "subscription",
            "membership", "loan payment", "car insurance", "hoa",
            "credit card", "prime", "dropbox", "renewal",
            "annual fee", "installment", "dues"
    ));
}

    /**
     * Automatically categorizes a transaction based on its description.
     * 
     * ALGORITHM:
     * 1. Convert description to lowercase (case-insensitive matching)
     * 2. For each category, count how many keywords appear in the description
     * 3. Store scores in a map: {"Food": 2, "Transportation": 1}
     * 4. Return the category with the highest score
     * 5. If no keywords match, return "Other"
     * 
     * @param description The transaction description (e.g., "Uber to work")
     * @return The predicted category (e.g., "Transportation")
     * 
     *         TIME COMPLEXITY: O(n * m) where n = number of categories, m =
     *         keywords per category
     *         This is fast enough for real-time categorization.
     */
    public String getCategoryFromAI(String description) {
        // Handle null or empty descriptions
        if (description == null || description.trim().isEmpty()) {
            return "Other";
        }

        // Convert to lowercase for case-insensitive matching
        String lowerDescription = description.toLowerCase();

        // Map to store each category's score
        Map<String, Integer> categoryScores = new HashMap<>();

        // Score each category based on keyword matches
        for (Map.Entry<String, List<String>> entry : CATEGORY_KEYWORDS.entrySet()) {
            String category = entry.getKey();
            int score = 0;

            // Count how many keywords from this category appear in the description
            for (String keyword : entry.getValue()) {
                if (lowerDescription.contains(keyword)) {
                    score++;
                }
            }

            // Only add categories that have at least one match
            if (score > 0) {
                categoryScores.put(category, score);
            }
        }

        // If no keywords matched, return "Other"
        if (categoryScores.isEmpty()) {
            return "Other";
        }

        // Return the category with the highest score using Stream API
        // max() finds the entry with highest value
        // map() extracts just the key (category name)
        // orElse() provides fallback if somehow empty
        return categoryScores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Other");
    }
}
