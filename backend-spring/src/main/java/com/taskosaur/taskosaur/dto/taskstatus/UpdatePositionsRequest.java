package com.taskosaur.taskosaur.dto.taskstatus;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePositionsRequest {
    private List<PositionUpdateItem> statusUpdates;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PositionUpdateItem {
        private String id;
        private Integer position;
    }
}
