package com.financeapp.controller;

import com.financeapp.model.Notification;
import com.financeapp.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateNotifications(
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            int count = notificationService.generateNotificationsForUser(userId);
            
            response.put("success", true);
            response.put("message", count > 0 
                ? "Generated " + count + " new notifications" 
                : "No new notifications to generate");
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            Authentication authentication,
            @RequestParam(required = false) Boolean unreadOnly) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            List<Notification> notifications = notificationService.getNotifications(userId, unreadOnly);
            
            response.put("success", true);
            response.put("notifications", notifications.stream().map(this::convertToMap).toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            Authentication authentication,
            @PathVariable Integer id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            notificationService.markAsRead(userId, id);
            
            response.put("success", true);
            response.put("message", "Notification marked as read");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(e.getMessage().contains("not found") ? 404 : 400).body(response);
        }
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            notificationService.markAllAsRead(userId);
            
            response.put("success", true);
            response.put("message", "All notifications marked as read");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    private Map<String, Object> convertToMap(Notification notification) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", notification.getId());
        map.put("user_id", notification.getUserId());
        map.put("message", notification.getMessage());
        map.put("type", notification.getType().toString());
        map.put("is_read", notification.getIsRead());
        map.put("created_at", notification.getCreatedAt());
        map.put("updated_at", notification.getUpdatedAt());
        return map;
    }
}

