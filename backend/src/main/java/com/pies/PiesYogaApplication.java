package com.pies;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class PiesYogaApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(PiesYogaApplication.class);
        Environment env = app.run(args).getEnvironment();
        String profile = String.join(",", env.getActiveProfiles());
        System.out.println("\n=========================================");
        System.out.println("     Spring Boot Active Profile: " + (profile.isEmpty() ? "default" : profile));
        System.out.println("=========================================\n");
    }


}
