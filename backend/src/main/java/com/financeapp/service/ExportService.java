package com.financeapp.service;

import com.financeapp.model.Transaction;
import com.financeapp.repository.TransactionRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.opencsv.CSVWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * ExportService handles the export functionality for transactions.
 * 
 * This service provides methods to export user transactions in two formats:
 * 1. CSV (Comma-Separated Values) - A simple text format for spreadsheet
 * applications
 * 2. PDF (Portable Document Format) - A formatted report with summary
 * 
 * Both methods fetch all transactions for a user and convert them to the
 * respective format.
 */
@Service
public class ExportService {

    // Inject the TransactionRepository to fetch transaction data from the database
    @Autowired
    private TransactionRepository transactionRepository;

    // Date formatter for displaying dates in a readable format (e.g., "05/01/2026")
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Generates a CSV file containing all transactions for a user.
     * 
     * CSV (Comma-Separated Values) is a simple file format where:
     * - Each line represents one transaction
     * - Values are separated by commas
     * - The first line contains column headers
     * 
     * Example output:
     * Date,Type,Category,Amount,Description
     * 05/01/2026,Income,Salary,50000.00,Monthly salary
     * 06/01/2026,Expense,Food,500.00,Groceries
     * 
     * @param userId The ID of the user whose transactions to export
     * @return byte[] The CSV file content as bytes (ready to be sent as a download)
     * @throws Exception If no transactions found or any error occurs during
     *                   generation
     */
    public byte[] generateCsv(Integer userId) throws Exception {
        // Step 1: Fetch all transactions for this user from the database
        // The repository method returns transactions ordered by date (newest first)
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);

        // Step 2: Check if user has any transactions
        // If not, throw an exception - we can't export empty data
        if (transactions == null || transactions.isEmpty()) {
            throw new Exception("No transactions found");
        }

        // Step 3: Create a ByteArrayOutputStream to hold the CSV data
        // This is like a container in memory where we'll write the CSV content
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        // Step 4: Create a CSVWriter that will format our data as CSV
        // OutputStreamWriter converts the stream to a writer that CSVWriter can use
        // StandardCharsets.UTF_8 ensures the file can handle special characters
        try (CSVWriter csvWriter = new CSVWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {

            // Step 5: Write the header row (column names)
            // This is the first row in the CSV that describes what each column contains
            String[] header = { "Date", "Type", "Category", "Amount", "Description" };
            csvWriter.writeNext(header);

            // Step 6: Loop through each transaction and write it as a row
            for (Transaction transaction : transactions) {
                // Create an array of strings representing each column value
                String[] row = {
                        // Format the date using our date formatter (e.g., "05/01/2026")
                        transaction.getTransactionDate().format(DATE_FORMATTER),
                        // Get the transaction type (income or expense)
                        // toString() converts the enum to a string
                        transaction.getType().toString(),
                        // Get the category (e.g., "Food", "Salary", etc.)
                        transaction.getCategory(),
                        // Convert the amount (BigDecimal) to a string for CSV
                        transaction.getAmount().toString(),
                        // Get the description, or empty string if null
                        // The ternary operator (condition ? valueIfTrue : valueIfFalse) handles null
                        // values
                        transaction.getDescription() != null ? transaction.getDescription() : ""
                };
                // Write this row to the CSV
                csvWriter.writeNext(row);
            }
        }

        // Step 7: Convert the ByteArrayOutputStream to a byte array and return
        // This byte array can be sent directly to the client as a file download
        return outputStream.toByteArray();
    }

    /**
     * Generates a PDF report containing all transactions for a user.
     * 
     * PDF (Portable Document Format) creates a nicely formatted document with:
     * - A title and generation date
     * - A table showing all transactions
     * - A summary section with totals (income, expense, balance)
     * 
     * This method uses the iText library to create the PDF.
     * iText provides classes like Document, Table, Cell, Paragraph to build PDF
     * content.
     * 
     * @param userId The ID of the user whose transactions to export
     * @return byte[] The PDF file content as bytes (ready to be sent as a download)
     * @throws Exception If no transactions found or any error occurs during
     *                   generation
     */
    public byte[] generatePdf(Integer userId) throws Exception {
        // Step 1: Fetch all transactions for this user from the database
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);

        // Step 2: Check if user has any transactions
        if (transactions == null || transactions.isEmpty()) {
            throw new Exception("No transactions found");
        }

        // Step 3: Create a ByteArrayOutputStream to hold the PDF data
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        // Step 4: Create PDF document objects
        // PdfWriter writes the PDF content to our output stream
        PdfWriter pdfWriter = new PdfWriter(outputStream);
        // PdfDocument is the core PDF object that manages pages and content
        PdfDocument pdfDocument = new PdfDocument(pdfWriter);
        // Document is a high-level wrapper that makes it easier to add content
        Document document = new Document(pdfDocument);

        // Step 5: Add the title "Transaction Report" centered at the top
        // Paragraph is a text element, like a paragraph in a word document
        // setFontSize() sets the text size, setTextAlignment() centers it
        Paragraph title = new Paragraph("Transaction Report")
                .setFontSize(20)
                .setTextAlignment(TextAlignment.CENTER)
                .setBold();
        document.add(title);

        // Step 6: Add the generation date below the title
        // LocalDate.now() gets today's date, format() converts it to a readable string
        Paragraph date = new Paragraph("Generated on: " + LocalDate.now().format(DATE_FORMATTER))
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(date);

        // Add some space before the table
        document.add(new Paragraph("\n"));

        // Step 7: Create a table with 5 columns (one for each field)
        // UnitValue.createPercentArray() sets the relative width of each column
        // The numbers represent percentages: Date(15%), Type(12%), Category(20%),
        // Amount(18%), Description(35%)
        Table table = new Table(UnitValue.createPercentArray(new float[] { 15, 12, 20, 18, 35 }));
        // Make the table span the full width of the page
        table.setWidth(UnitValue.createPercentValue(100));

        // Step 8: Add table headers with gray background
        // addHeaderCell() is a helper method defined below that creates styled header
        // cells
        addHeaderCell(table, "Date");
        addHeaderCell(table, "Type");
        addHeaderCell(table, "Category");
        addHeaderCell(table, "Amount");
        addHeaderCell(table, "Description");

        // Step 9: Initialize totals for the summary section
        // BigDecimal is used for precise decimal arithmetic (important for money!)
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        // Step 10: Add each transaction as a row in the table
        for (Transaction transaction : transactions) {
            // Add cells for each column
            table.addCell(new Cell().add(new Paragraph(transaction.getTransactionDate().format(DATE_FORMATTER))));

            // Capitalize the first letter of type for better display
            // "income" becomes "Income", "expense" becomes "Expense"
            String type = transaction.getType().toString();
            String formattedType = type.substring(0, 1).toUpperCase() + type.substring(1).toLowerCase();
            table.addCell(new Cell().add(new Paragraph(formattedType)));

            table.addCell(new Cell().add(new Paragraph(transaction.getCategory())));

            // Format amount with Rs prefix (Indian Rupee)
            // setScale(2) ensures exactly 2 decimal places
            table.addCell(new Cell().add(new Paragraph("Rs " + transaction.getAmount().setScale(2))));

            // Handle null description
            String description = transaction.getDescription() != null ? transaction.getDescription() : "";
            // Truncate long descriptions to 50 characters
            if (description.length() > 50) {
                description = description.substring(0, 50) + "...";
            }
            table.addCell(new Cell().add(new Paragraph(description)));

            // Step 11: Update totals based on transaction type
            if (transaction.getType() == Transaction.TransactionType.income) {
                totalIncome = totalIncome.add(transaction.getAmount());
            } else {
                totalExpense = totalExpense.add(transaction.getAmount());
            }
        }

        // Add the table to the document
        document.add(table);

        // Step 12: Add summary section with totals
        document.add(new Paragraph("\n"));

        Paragraph summaryTitle = new Paragraph("Summary")
                .setFontSize(14)
                .setBold();
        document.add(summaryTitle);

        // Calculate balance (income - expense)
        BigDecimal balance = totalIncome.subtract(totalExpense);

        // Add total income, expense, and balance
        document.add(new Paragraph("Total Income: Rs " + totalIncome.setScale(2)));
        document.add(new Paragraph("Total Expense: Rs " + totalExpense.setScale(2)));
        document.add(new Paragraph("Balance: Rs " + balance.setScale(2)).setBold());

        // Step 13: Close the document and return the byte array
        // Closing the document finalizes the PDF and flushes all content to the stream
        document.close();

        return outputStream.toByteArray();
    }

    /**
     * Helper method to add a styled header cell to the table.
     * 
     * This method creates a cell with:
     * - Gray background color
     * - Bold text
     * - Padding for better readability
     * 
     * @param table The table to add the header cell to
     * @param text  The text to display in the header cell
     */
    private void addHeaderCell(Table table, String text) {
        Cell cell = new Cell()
                // Add the text as a Paragraph inside the cell
                .add(new Paragraph(text).setBold())
                // Set light gray background for headers
                .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                // Add padding inside the cell for better spacing
                .setPadding(5);
        table.addCell(cell);
    }
}
