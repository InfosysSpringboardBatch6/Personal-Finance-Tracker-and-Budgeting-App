package com.financeapp.controller;

import com.financeapp.service.ExportService;
import com.financeapp.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    // Inject the ExportService to handle CSV and PDF generation
    @Autowired
    private ExportService exportService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTransaction(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Map<String, Object> result = transactionService.createTransaction(userId, request);
            response.put("success", true);
            response.putAll(result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getTransactions(
            Authentication authentication,
            @RequestParam(required = false) String frequency,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int pageSize) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Pageable pageable = PageRequest.of(page - 1, pageSize);
            Map<String, Object> result = transactionService.getTransactions(
                    userId, frequency, type, startDate, endDate, pageable);
            response.put("success", true);
            response.putAll(result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "365") String frequency,
            @RequestParam(required = false, defaultValue = "all") String type,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Map<String, Object> analytics = transactionService.getAnalytics(
                    userId, frequency, type, startDate, endDate);
            response.put("success", true);
            response.put("data", analytics);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    // ==================== EXPORT ENDPOINTS ====================
    // These endpoints allow users to download their transactions as files.
    // They return file downloads instead of JSON responses.

    /**
     Export transactions as CSV (Comma-Separated Values) file. 
     Endpoint: GET /api/user/transactions/export/csv
     
     This endpoint:
     1. Gets the authenticated user's ID from the security context
     2. Calls the ExportService to generate CSV data
     3. Returns the CSV as a file download
     @param authentication Contains the logged-in user's information
     @return CSV file download or JSON error response
     */
    @GetMapping("/export/csv")
    public ResponseEntity<?> exportCsv(Authentication authentication) {
        try {
            // Step 1: Get the user ID from the authentication token
            // The principal contains the user ID that was set during JWT authentication
            Integer userId = (Integer) authentication.getPrincipal();

            // Step 2: Generate the CSV data using our ExportService
            // This returns a byte array containing the CSV content
            byte[] csvData = exportService.generateCsv(userId);

            // Step 3: Set up the HTTP headers for file download
            // HttpHeaders is a Spring class that helps set response headers
            HttpHeaders headers = new HttpHeaders();

            // Content-Disposition header tells the browser to download this as a file
            // "attachment" means download, "filename=..." sets the default filename
            headers.setContentDispositionFormData("attachment", "transactions.csv");

            // Content-Type tells the browser what type of file this is
            // "text/csv" is the MIME type for CSV files
            headers.setContentType(MediaType.parseMediaType("text/csv"));

            // Step 4: Return the response with the CSV data
            // ResponseEntity wraps the response with status code, headers, and body
            // HttpStatus.OK means 200 success
            return new ResponseEntity<>(csvData, headers, HttpStatus.OK);

        } catch (Exception e) {
            // If an error occurs (e.g., no transactions found), return a JSON error
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());

            // Return 404 for "no transactions found", 500 for other errors
            if (e.getMessage().contains("No transactions found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Export transactions as PDF (Portable Document Format) file.
     * 
     * Endpoint: GET /api/user/transactions/export/pdf
     * 
     * This endpoint works similarly to the CSV export but:
     * - Returns a PDF file instead of CSV
     * - The PDF includes formatting, tables, and a summary section
     * 
     * @param authentication Contains the logged-in user's information
     * @return PDF file download or JSON error response
     */
    @GetMapping("/export/pdf")
    public ResponseEntity<?> exportPdf(Authentication authentication) {
        try {
            // Step 1: Get the user ID from the authentication token
            Integer userId = (Integer) authentication.getPrincipal();

            // Step 2: Generate the PDF data using our ExportService
            // The PDF generation is more complex than CSV (see ExportService for details)
            byte[] pdfData = exportService.generatePdf(userId);

            // Step 3: Set up the HTTP headers for PDF file download
            HttpHeaders headers = new HttpHeaders();

            // Set the filename for the download
            headers.setContentDispositionFormData("attachment", "transactions.pdf");

            // "application/pdf" is the MIME type for PDF files
            headers.setContentType(MediaType.APPLICATION_PDF);

            // Step 4: Return the response with the PDF data
            return new ResponseEntity<>(pdfData, headers, HttpStatus.OK);

        } catch (Exception e) {
            // If an error occurs, return a JSON error response
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());

            // Return appropriate status code based on error type
            if (e.getMessage().contains("No transactions found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTransaction(
            Authentication authentication,
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Map<String, Object> result = transactionService.updateTransaction(userId, id, request);
            response.put("success", true);
            response.putAll(result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTransaction(
            Authentication authentication,
            @PathVariable Integer id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            transactionService.deleteTransaction(userId, id);
            response.put("success", true);
            response.put("message", "Expense deleted");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

}
