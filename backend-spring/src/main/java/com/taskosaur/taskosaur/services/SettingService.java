package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.setting.SetSettingRequest;
import com.taskosaur.taskosaur.dto.setting.SettingResponse;
import com.taskosaur.taskosaur.models.Setting;
import com.taskosaur.taskosaur.repositories.SettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class SettingService {

    private final SettingRepository settingRepository;

    public List<SettingResponse> getAll(String userId, String category) {
        List<Setting> settings;
        if (category != null && !category.isBlank()) {
            settings = (userId != null && !userId.isBlank())
                    ? settingRepository.findByUserIdAndCategory(userId, category)
                    : settingRepository.findByUserIdIsNullAndCategory(category);
        } else {
            settings = (userId != null && !userId.isBlank())
                    ? settingRepository.findByUserId(userId)
                    : settingRepository.findByUserIdIsNull();
        }

        return settings.stream().map(this::mapToResponse).toList();
    }

    public String get(String key, String userId, String defaultValue) {
        if (userId != null && !userId.isBlank()) {
            Optional<Setting> userSetting = settingRepository.findByUserIdAndKey(userId, key);
            if (userSetting.isPresent() && userSetting.get().getValue() != null) {
                return userSetting.get().getValue();
            }
        }

        Optional<Setting> globalSetting = settingRepository.findByUserIdIsNullAndKey(key);
        return globalSetting.map(Setting::getValue).orElse(defaultValue);
    }

    public void set(String key, String value, String userId, String description, String category, Boolean isEncrypted) {
        Optional<Setting> existing = (userId != null && !userId.isBlank())
                ? settingRepository.findByUserIdAndKey(userId, key)
                : settingRepository.findByUserIdIsNullAndKey(key);

        Setting setting;
        if (existing.isPresent()) {
            setting = existing.get();
            setting.setValue(value);
            if (description != null) setting.setDescription(description);
            if (category != null) setting.setCategory(category);
            if (isEncrypted != null) setting.setIsEncrypted(isEncrypted);
        } else {
            setting = Setting.builder()
                    .key(key)
                    .value(value)
                    .userId(userId)
                    .description(description)
                    .category(category != null ? category : "general")
                    .isEncrypted(isEncrypted != null ? isEncrypted : false)
                    .build();
        }

        settingRepository.save(setting);
    }

    public void bulkSet(List<SetSettingRequest> list, String userId) {
        if (list == null) return;
        for (SetSettingRequest req : list) {
            set(req.getKey(), req.getValue(), userId, req.getDescription(), req.getCategory(), req.getIsEncrypted());
        }
    }

    public void delete(String key, String userId) {
        if (userId != null && !userId.isBlank()) {
            settingRepository.deleteByUserIdAndKey(userId, key);
        }
    }

    private SettingResponse mapToResponse(Setting setting) {
        return SettingResponse.builder()
                .id(setting.getId())
                .key(setting.getKey())
                .value(setting.getValue())
                .description(setting.getDescription())
                .category(setting.getCategory())
                .isEncrypted(setting.getIsEncrypted())
                .build();
    }
}
