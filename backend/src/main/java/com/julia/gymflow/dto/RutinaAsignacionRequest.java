package com.julia.gymflow.dto;

import java.util.ArrayList;
import java.util.List;

public class RutinaAsignacionRequest {

    private List<Long> clienteIds = new ArrayList<>();

    public List<Long> getClienteIds() {
        return clienteIds;
    }

    public void setClienteIds(List<Long> clienteIds) {
        this.clienteIds = clienteIds;
    }
}
