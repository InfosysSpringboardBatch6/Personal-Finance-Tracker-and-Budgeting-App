package com.financeapp.repository;

import com.financeapp.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Integer> {
    Page<Transaction> findByUserIdOrderByTransactionDateDescCreatedAtDesc(Integer userId, Pageable pageable);

    List<Transaction> findByUserId(Integer userId);

    // Method to get all transactions for a user, ordered by date (newest first)
    // Used by the export feature to generate CSV and PDF reports
    List<Transaction> findByUserIdOrderByTransactionDateDesc(Integer userId);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
            "AND (:fromDate IS NULL OR t.transactionDate >= :fromDate) " +
            "AND (:toDate IS NULL OR t.transactionDate <= :toDate) " +
            "AND (:type IS NULL OR t.type = :type) " +
            "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<Transaction> findTransactionsWithFilters(
            @Param("userId") Integer userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("type") Transaction.TransactionType type,
            Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
            "AND (:fromDate IS NULL OR t.transactionDate >= :fromDate) " +
            "AND (:toDate IS NULL OR t.transactionDate <= :toDate) " +
            "AND (:type IS NULL OR t.type = :type)")
    List<Transaction> findTransactionsForAnalytics(
            @Param("userId") Integer userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("type") Transaction.TransactionType type);
}
