package com.pharmasathi.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class TenantDataMigration implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    public TenantDataMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        Long firstShopId = jdbc.query(
                "select id from shop_account order by id fetch first 1 row only",
                resultSet -> resultSet.next() ? resultSet.getLong(1) : null
        );
        if (firstShopId == null) return;

        for (String table : new String[]{"medicines", "suppliers", "purchases", "sales"}) {
            jdbc.update("update " + table + " set shop_id = ? where shop_id is null or shop_id = 0", firstShopId);
        }
    }
}
