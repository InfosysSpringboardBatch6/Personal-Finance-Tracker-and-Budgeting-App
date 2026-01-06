package com.financeapp.config;

import com.financeapp.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Spring Security Configuration
 * 
 * This class configures how Spring Security handles:
 * - Authentication (who are you?)
 * - Authorization (what can you access?)
 * - CORS (Cross-Origin Resource Sharing)
 * - Session management
 * 
 * KEY CONCEPTS:
 * - @Configuration: Tells Spring this class contains bean definitions
 * - @EnableWebSecurity: Enables Spring Security's web security support
 * - SecurityFilterChain: The chain of security filters applied to requests
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Our custom JWT filter that validates tokens
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Configures the security filter chain - the heart of Spring Security.
     * 
     * This defines:
     * - Which endpoints are public vs protected
     * - How authentication works
     * - CORS and CSRF settings
     * 
     * @param http The HttpSecurity builder
     * @return The configured SecurityFilterChain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF (Cross-Site Request Forgery) Protection
                // Disabled because we're using JWT tokens (stateless) instead of sessions
                // JWT tokens themselves provide CSRF protection
                .csrf(csrf -> csrf.disable())

                // CORS (Cross-Origin Resource Sharing)
                // Allows our frontend (different port/domain) to call our API
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Session Management
                // STATELESS = No server-side sessions, every request must include JWT token
                // This is the standard approach for REST APIs
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Authorization Rules - Which endpoints require authentication
                .authorizeHttpRequests(auth -> auth
                        // PUBLIC endpoints - anyone can access (no token required)
                        .requestMatchers("/api/user/register", "/api/user/login", "/").permitAll()
                        // ALL OTHER endpoints require authentication (valid JWT token)
                        .anyRequest().authenticated())

                // Add our JWT filter BEFORE Spring's default authentication filter
                // This ensures JWT validation happens first
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Password Encoder Bean
     * 
     * BCrypt is a one-way hashing algorithm designed for passwords.
     * - Automatically adds a random "salt" to prevent rainbow table attacks
     * - Intentionally slow to prevent brute-force attacks
     * - Industry standard for password storage
     * 
     * Used when:
     * - Registering: Hash the password before saving to database
     * - Logging in: Compare hashed passwords
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * CORS Configuration
     * 
     * CORS prevents browsers from making requests to a different domain
     * than where the page was loaded from (security feature).
     * 
     * Since our frontend (React on port 3000) calls our backend (port 4000),
     * we need to explicitly allow this cross-origin communication.
     * 
     * Configuration:
     * - AllowedOrigins: Which domains can call our API ("*" = any)
     * - AllowedMethods: Which HTTP methods are allowed
     * - AllowedHeaders: Which headers can be sent
     * - ExposedHeaders: Which headers can be read by the frontend
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow requests from any origin (for development)
        // In production, you should specify exact domains like "https://yourapp.com"
        configuration.setAllowedOrigins(Arrays.asList("*"));

        // Allow these HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Allow any header (including our "usertoken" header)
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Expose all headers to the frontend
        configuration.setExposedHeaders(Arrays.asList("*"));

        // Apply this configuration to all endpoints
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
