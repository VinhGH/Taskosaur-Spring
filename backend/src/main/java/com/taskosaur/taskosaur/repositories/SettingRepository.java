package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.Setting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SettingRepository extends JpaRepository<Setting, String> {
    List<Setting> findByUserId(String userId);
    List<Setting> findByUserIdAndCategory(String userId, String category);
    List<Setting> findByUserIdIsNull();
    List<Setting> findByUserIdIsNullAndCategory(String category);
    Optional<Setting> findByUserIdAndKey(String userId, String key);
    Optional<Setting> findByUserIdIsNullAndKey(String key);
    void deleteByUserIdAndKey(String userId, String key);
}
