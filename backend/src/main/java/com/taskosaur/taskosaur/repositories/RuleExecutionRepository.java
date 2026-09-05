package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.RuleExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RuleExecutionRepository extends JpaRepository<RuleExecution, String> {

    List<RuleExecution> findByRuleIdOrderByCreatedAtDesc(String ruleId);
}
