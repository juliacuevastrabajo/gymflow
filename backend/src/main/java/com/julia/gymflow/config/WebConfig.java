package com.julia.gymflow.config;

import com.julia.gymflow.service.ArchivoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ArchivoService archivoService;
    private final String[] allowedOrigins;

    public WebConfig(
            ArchivoService archivoService,
            @Value("${gymflow.cors.allowed-origins:http://localhost:8081}") String allowedOrigins
    ) {
        this.archivoService = archivoService;
        this.allowedOrigins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type")
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(archivoService.getDirectorio().toUri().toString());
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new org.springframework.web.servlet.HandlerInterceptor() {
            @Override
            public boolean preHandle(
                    jakarta.servlet.http.HttpServletRequest request,
                    jakarta.servlet.http.HttpServletResponse response,
                    Object handler
            ) throws Exception {
                response.setHeader("X-Content-Type-Options", "nosniff");
                String ruta = request.getRequestURI();
                if (ruta.equals("/uploads/.tmp") || ruta.startsWith("/uploads/.tmp/")) {
                    response.sendError(404);
                    return false;
                }
                String method = request.getMethod();
                if (!HttpMethod.GET.matches(method) && !HttpMethod.HEAD.matches(method)) {
                    response.sendError(405);
                    return false;
                }
                return true;
            }
        }).addPathPatterns("/uploads/**");
    }
}
