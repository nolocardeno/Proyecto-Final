package com.nolocardeno.backend.security;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class TokenBlacklistServiceTest {

    @Test
    void revoked_token_is_reported_as_revoked() {
        TokenBlacklistService service = new TokenBlacklistService();
        long future = Instant.now().toEpochMilli() + 60_000L;

        service.revoke("abc.def.ghi", future);

        assertThat(service.isRevoked("abc.def.ghi")).isTrue();
        assertThat(service.size()).isEqualTo(1);
    }

    @Test
    void unknown_token_is_not_revoked() {
        TokenBlacklistService service = new TokenBlacklistService();
        assertThat(service.isRevoked("anything")).isFalse();
        assertThat(service.isRevoked(null)).isFalse();
    }

    @Test
    void revoke_ignores_null_or_blank_tokens() {
        TokenBlacklistService service = new TokenBlacklistService();
        service.revoke(null, 123L);
        service.revoke("   ", 123L);
        assertThat(service.size()).isZero();
    }

    @Test
    void expired_entry_is_purged_on_check() {
        TokenBlacklistService service = new TokenBlacklistService();
        long past = Instant.now().toEpochMilli() - 10_000L;
        // First insert a future entry to avoid auto-purge swallowing the past one
        service.revoke("future", Instant.now().toEpochMilli() + 60_000L);
        // Now insert the past entry; auto-purge will drop it but isRevoked
        // also handles the case of stale entries that survived.
        service.revoke("past", past);

        assertThat(service.isRevoked("past")).isFalse();
    }
}
