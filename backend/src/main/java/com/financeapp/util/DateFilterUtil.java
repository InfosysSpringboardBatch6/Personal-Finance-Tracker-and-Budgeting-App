package com.financeapp.util;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

public class DateFilterUtil {
    
    public static Map<String, LocalDate> parseDateFilters(String frequency, String startDate, String endDate) {
        LocalDate fromDate = null;
        LocalDate toDate = null;
        LocalDate now = LocalDate.now();
        
        // Handle custom date range
        if ("custom".equals(frequency) && startDate != null && endDate != null) {
            fromDate = LocalDate.parse(startDate);
            toDate = LocalDate.parse(endDate);
        } else if (frequency != null && !frequency.equals("all")) {
            // Parse numeric frequency (e.g., "30" means last 30 days)
            try {
                int days = Integer.parseInt(frequency);
                fromDate = now.minusDays(days);
                toDate = now;
            } catch (NumberFormatException e) {
                // Invalid frequency, treat as "all"
            }
        }
        // If frequency is "all" or null, fromDate and toDate remain null
        
        Map<String, LocalDate> result = new HashMap<>();
        result.put("fromDate", fromDate);
        result.put("toDate", toDate);
        return result;
    }
}

