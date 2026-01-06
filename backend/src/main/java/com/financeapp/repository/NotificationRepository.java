package com.financeapp.repository;

import com.financeapp.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);
    
    List<Notification> findTop6ByUserIdOrderByCreatedAtDesc(Integer userId);
    
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Integer userId);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId")
    long countByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId " +
           "AND n.message = :message " +
           "AND n.createdAt >= :threshold")
    List<Notification> findDuplicateNotifications(
        @Param("userId") Integer userId,
        @Param("message") String message,
        @Param("threshold") LocalDateTime threshold
    );
    
    // Delete old notifications - keep only 5 most recent
    // This is handled in service layer for better compatibility
}

