package com.taskosaur.taskosaur.dto.notification;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkDeleteNotificationsRequest {
    private List<String> ids;
}
