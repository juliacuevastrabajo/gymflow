package com.julia.gymflow.dto;

import java.util.ArrayList;
import java.util.List;

public class RutinaOrdenRequest {

    private List<Long> rutinaEjercicioIds = new ArrayList<>();

    public List<Long> getRutinaEjercicioIds() {
        return rutinaEjercicioIds;
    }

    public void setRutinaEjercicioIds(List<Long> rutinaEjercicioIds) {
        this.rutinaEjercicioIds = rutinaEjercicioIds;
    }
}
