import assert from "node:assert/strict";
import test from "node:test";

import {
  isClassCalendarDayDisabled,
  resolveClassCalendarSelectionAfterDayChange,
} from "./classCalendar.ts";

const roles = ["CLIENTE", "ENTRENADOR"];

test("cliente y entrenador deshabilitan los dias pasados de la semana actual", () => {
  for (const role of roles) {
    assert.equal(
      isClassCalendarDayDisabled({
        role,
        weekOffset: 0,
        dayKey: "2026-08-24",
        todayKey: "2026-08-25",
      }),
      true,
    );
  }
});

test("hoy permanece habilitado para cliente y entrenador", () => {
  for (const role of roles) {
    assert.equal(
      isClassCalendarDayDisabled({
        role,
        weekOffset: 0,
        dayKey: "2026-08-25",
        todayKey: "2026-08-25",
      }),
      false,
    );
  }
});

test("las semanas futuras permanecen habilitadas para cliente y entrenador", () => {
  for (const role of roles) {
    assert.equal(
      isClassCalendarDayDisabled({
        role,
        weekOffset: 1,
        dayKey: "2026-08-24",
        todayKey: "2026-08-25",
      }),
      false,
    );
  }
});

test("el cambio de dia corrige selecciones pasadas en ambos roles", () => {
  for (const role of roles) {
    assert.deepEqual(
      resolveClassCalendarSelectionAfterDayChange({
        role,
        selectedDay: "2026-08-25",
        todayKey: "2026-08-26",
      }),
      { selectedDay: "2026-08-26", weekOffset: 0 },
    );
    assert.equal(
      resolveClassCalendarSelectionAfterDayChange({
        role,
        selectedDay: "2026-08-27",
        todayKey: "2026-08-26",
      }),
      null,
    );
  }
});
