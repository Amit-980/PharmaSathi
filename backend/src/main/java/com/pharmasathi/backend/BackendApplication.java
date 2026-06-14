package com.pharmasathi.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		String databaseUrl = System.getenv("DATABASE_URL");
		if (System.getenv("PHARMASATHI_DB_URL") == null
				&& databaseUrl != null
				&& databaseUrl.startsWith("postgresql://")) {
			System.setProperty("PHARMASATHI_DB_URL", "jdbc:" + databaseUrl);
		}
		SpringApplication.run(BackendApplication.class, args);
	}

}
