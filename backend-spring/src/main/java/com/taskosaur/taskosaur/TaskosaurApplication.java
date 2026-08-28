package com.taskosaur.taskosaur;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.File;
import java.util.List;

@SpringBootApplication
@EnableAsync
public class TaskosaurApplication {

	private static final Logger logger = LoggerFactory.getLogger(TaskosaurApplication.class);

	public static void main(String[] args) {
		loadDotenv();
		SpringApplication.run(TaskosaurApplication.class, args);
	}

	private static void loadDotenv() {
		List<String> candidatePaths = List.of(
				".",
				"./Taskosaur",
				"./Taskosaur/backend-spring",
				"./backend-spring",
				"..",
				"../Taskosaur",
				"../Taskosaur/backend-spring"
		);

		for (String path : candidatePaths) {
			File file = new File(path, ".env");
			if (file.exists() && file.isFile()) {
				try {
					Dotenv dotenv = Dotenv.configure().directory(path).ignoreIfMissing().load();
					setSystemProperties(dotenv);
					logger.info(">>> [Taskosaur] Successfully loaded .env from: {}", file.getAbsolutePath());
				} catch (Exception _) {
					// Continue trying next candidate
				}
			}
		}
	}

	private static void setSystemProperties(Dotenv dotenv) {
		if (dotenv != null) {
			dotenv.entries().forEach(entry -> {
				if (entry.getValue() != null && !entry.getValue().isBlank()) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
		}
	}

}
