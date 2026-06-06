package com.pharmasathi.backend.repository;

import com.pharmasathi.backend.entity.ShopAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShopAccountRepository extends JpaRepository<ShopAccount, Long> {
    Optional<ShopAccount> findFirstByOrderByIdAsc();
    Optional<ShopAccount> findByUsername(String username);
    boolean existsByUsername(String username);
}
