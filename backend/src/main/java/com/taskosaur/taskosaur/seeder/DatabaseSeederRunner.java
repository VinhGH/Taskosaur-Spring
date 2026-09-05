package com.taskosaur.taskosaur.seeder;

import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeederRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DatabaseSeederService databaseSeederService;

    @Override
    public void run(String... args) {
        // Automatically seed demo data if database has no users
        if (userRepository.count() == 0) {
            log.info("Database is empty. Automatically executing initial Enterprise seed...");
            databaseSeederService.seedAll();
        } else {
            log.info("Database already initialized with {} users. Skipping automatic seed.", userRepository.count());
        }
    }
}
