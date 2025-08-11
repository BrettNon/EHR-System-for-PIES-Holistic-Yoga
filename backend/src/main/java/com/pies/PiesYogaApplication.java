package com.pies;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class PiesYogaApplication {

    private static final Logger logger = LoggerFactory.getLogger(PiesYogaApplication.class);


    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(PiesYogaApplication.class);
        Environment env = app.run(args).getEnvironment();
        String profile = String.join(",", env.getActiveProfiles());
        logger.info("\n=========================================");
        logger.info("     Spring Boot Active Profile: {}", (profile.isEmpty() ? "default" : profile));
        logger.info("=========================================\n");
    }


}
