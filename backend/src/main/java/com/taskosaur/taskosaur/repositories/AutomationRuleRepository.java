package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.enums.RuleStatus;
import com.taskosaur.taskosaur.enums.TriggerType;
import com.taskosaur.taskosaur.models.AutomationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AutomationRuleRepository extends JpaRepository<AutomationRule, String> {

    List<AutomationRule> findByProjectId(String projectId);

    List<AutomationRule> findByProjectIdAndStatus(String projectId, RuleStatus status);

    List<AutomationRule> findByProjectIdAndStatusAndTriggerType(String projectId, RuleStatus status, TriggerType triggerType);
}
