package com.financeapp.controller;

import com.financeapp.dto.*;
import com.financeapp.model.User;
import com.financeapp.service.UserService;
import com.financeapp.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = userService.register(request);
            String token = jwtUtil.generateToken(user.getId());
            response.put("success", true);
            response.put("usertoken", token);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = userService.login(request);
            String token = jwtUtil.generateToken(user.getId());
            response.put("success", true);
            response.put("usertoken", token);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            Map<String, Object> userData = userService.getProfile(userId);
            response.put("success", true);
            response.put("userdata", userData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/update-profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            Authentication authentication,
            @RequestParam("name") String name,
            @RequestParam("dob") String dob,
            @RequestParam("gender") String gender,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = (Integer) authentication.getPrincipal();
            userService.updateProfile(userId, name, dob, gender, imageFile);
            response.put("success", true);
            response.put("message", "Profile Updated");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
