package com.hotel.booking.config;

import com.hotel.booking.security.JwtAuthenticationFilter;
import com.hotel.booking.service.impl.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:8080", "http://127.0.0.1:8080"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // ✅ ВАЖНО: Публичные страницы
                        .requestMatchers("/", "/home", "/aboutUs", "/login", "/register", "/catalog").permitAll()

                        // ✅ ВАЖНО: API аутентификации
                        .requestMatchers("/api/auth/**").permitAll()

                        // ✅ ВАЖНО: Статические ресурсы
                        .requestMatchers("/css/**", "/js/**", "/html/**", "/images/**", "/uploads/**").permitAll()

                        // ✅ ВАЖНО: API комнат (публичный доступ)
                        .requestMatchers("/api/rooms/**").permitAll()

                        // ✅ ВАЖНО: API бронирований (требуется аутентификация!)
                        .requestMatchers("/api/booking/**").authenticated()

                        // ✅ ВАЖНО: API кошелька (требуется аутентификация)
                        .requestMatchers("/api/wallet/**").authenticated()

                        // ✅ ВАЖНО: API пользователей
                        .requestMatchers("/api/users/**").authenticated()

                        // ✅ ВАЖНО: Админ-панель
                        .requestMatchers("/api/admin", "/api/admin/**").hasRole("ADMIN")

                        // ✅ ВАЖНО: Защищённые страницы
                        .requestMatchers("/setting", "/wallet", "/booking", "/profile").authenticated()

                        // Всё остальное - требует аутентификации
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
