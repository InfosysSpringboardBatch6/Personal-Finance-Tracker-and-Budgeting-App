package com.financeapp.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

/**
 * JWT (JSON Web Token) Utility Class
 * 
 * This class handles all JWT-related operations for authentication:
 * - Generating tokens when users log in
 * - Validating tokens on each request
 * - Extracting user information from tokens
 * 
 * HOW JWT WORKS:
 * 1. User logs in with email/password
 * 2. Server validates credentials and generates a JWT token
 * 3. Token is sent back to client and stored (usually in localStorage)
 * 4. Client sends token with every request in the "usertoken" header
 * 5. Server validates the token and extracts user ID to identify the user
 * 
 * JWT STRUCTURE (3 parts separated by dots):
 * - Header: Algorithm used (HS256) and token type (JWT)
 * - Payload: Data we store (user ID, expiration time)
 * - Signature: Encrypted combination of header + payload + secret key
 */
@Component
public class JwtUtil {

    // Secret key for signing tokens - loaded from application.properties
    // IMPORTANT: Must be at least 256 bits (32 characters) for HS256 algorithm
    @Value("${jwt.secret}")
    private String secret;

    // Token expiration time in milliseconds (e.g., 86400000 = 24 hours)
    @Value("${jwt.expiration}")
    private Long expiration;

    /**
     * Creates a SecretKey object from the secret string.
     * The key is used to sign and verify JWT tokens.
     * 
     * Keys.hmacShaKeyFor() creates an HMAC-SHA key from the byte array.
     * HMAC = Hash-based Message Authentication Code
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generates a new JWT token for a user after successful login.
     * 
     * @param userId The user's database ID to embed in the token
     * @return A signed JWT token string
     * 
     *         Token contains:
     *         - subject: The user ID (who this token belongs to)
     *         - issuedAt: When the token was created
     *         - expiration: When the token expires (current time + expiration
     *         period)
     *         - signature: Cryptographic signature using our secret key
     */
    public String generateToken(Integer userId) {
        return Jwts.builder()
                .subject(String.valueOf(userId)) // Store user ID as the subject
                .issuedAt(new Date()) // Token creation timestamp
                .expiration(new Date(System.currentTimeMillis() + expiration)) // Expiry time
                .signWith(getSigningKey()) // Sign with our secret key
                .compact(); // Build the token string
    }

    /**
     * Extracts the user ID from a JWT token.
     * Used to identify which user is making a request.
     * 
     * @param token The JWT token from the request header
     * @return The user ID stored in the token
     */
    public Integer getUserIdFromToken(String token) {
        return Integer.parseInt(getClaimFromToken(token, Claims::getSubject));
    }

    /**
     * Gets the expiration date from a token.
     * Used to check if the token has expired.
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    /**
     * Generic method to extract any claim from a token.
     * Uses Java's Function interface for flexibility.
     * 
     * @param token          The JWT token
     * @param claimsResolver A function that extracts the desired claim
     * @return The extracted claim value
     */
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parses the token and extracts all claims (payload data).
     * This also validates the token's signature automatically.
     * 
     * If the signature is invalid or token is malformed,
     * an exception will be thrown.
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey()) // Verify using our secret key
                .build()
                .parseSignedClaims(token) // Parse and validate the token
                .getPayload(); // Get the claims (payload)
    }

    /**
     * Validates a JWT token.
     * 
     * Checks:
     * 1. Token can be parsed (valid format)
     * 2. Signature is valid (not tampered with)
     * 3. Token has a subject (user ID)
     * 4. Token has not expired
     * 
     * @param token The JWT token to validate
     * @return true if valid, false otherwise
     */
    public Boolean validateToken(String token) {
        try {
            Claims claims = getAllClaimsFromToken(token);
            return claims.getSubject() != null && !isTokenExpired(token);
        } catch (Exception e) {
            // Any exception means invalid token (expired, malformed, wrong signature, etc.)
            return false;
        }
    }

    /**
     * Checks if a token has expired by comparing expiration date with current time.
     */
    private Boolean isTokenExpired(String token) {
        return getExpirationDateFromToken(token).before(new Date());
    }
}
