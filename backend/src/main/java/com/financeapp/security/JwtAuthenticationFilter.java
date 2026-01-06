package com.financeapp.security;

import com.financeapp.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

/**
 * JWT Authentication Filter
 * 
 * This filter intercepts EVERY HTTP request to check for JWT authentication.
 * It runs BEFORE the request reaches any controller.
 * 
 * HOW IT WORKS:
 * 1. Request comes in with "usertoken" header
 * 2. Filter extracts the token from the header
 * 3. Validates the token using JwtUtil
 * 4. If valid, extracts user ID and creates an Authentication object
 * 5. Sets the Authentication in SecurityContext (Spring Security's way of
 * knowing who is logged in)
 * 6. Request continues to the controller with user authenticated
 * 
 * EXTENDS OncePerRequestFilter:
 * Guarantees this filter runs exactly once per request
 * (important because requests might be forwarded internally)
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Main filter method - called for every HTTP request.
     * 
     * @param request     The incoming HTTP request
     * @param response    The HTTP response (we don't modify it here)
     * @param filterChain The chain of filters to continue with
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Step 1: Extract the token from the "usertoken" header
        // Our frontend sends the JWT in this custom header after login
        String token = request.getHeader("usertoken");

        // Step 2: Check if token exists and is valid
        if (token != null && jwtUtil.validateToken(token)) {

            // Step 3: Extract the user ID from the token
            Integer userId = jwtUtil.getUserIdFromToken(token);

            // Step 4: Check if user ID exists and no authentication is already set
            // (prevents overwriting existing authentication)
            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Step 5: Create an Authentication object
                // This tells Spring Security who the user is
                // Parameters:
                // - principal: The user ID (what we use to identify the user)
                // - credentials: null (we already validated the token, no password needed)
                // - authorities: empty list (we're not using role-based permissions)
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userId,
                        null, new ArrayList<>());

                // Add request details (IP address, session ID, etc.) for logging/auditing
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Step 6: Store the Authentication in SecurityContext
                // Now Spring Security knows this request is authenticated
                // Controllers can access the user ID via authentication.getPrincipal()
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        // Step 7: Continue with the filter chain
        // If token was invalid or missing, request continues without authentication
        // Spring Security will block protected endpoints (returns 401/403)
        filterChain.doFilter(request, response);
    }
}
