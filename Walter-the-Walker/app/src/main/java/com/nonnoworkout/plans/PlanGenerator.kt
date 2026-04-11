package com.nonnoworkout.plans

import com.nonnoworkout.data.PlanItemEntity

class PlanGenerator {
    fun generatePlan(
        eta: Int,
        livello: String,
        obiettivi: String,
        giorniDisponibili: List<String>
    ): List<PlanItemEntity> {
        return giorniDisponibili.mapIndexed { index, giorno ->
            PlanItemEntity(
                planId = 0,
                activityId = index.toLong() + 1,
                giornoSettimana = giorno,
                serie = if (livello.lowercase() == "principiante") 2 else 3,
                ripetizioni = 12,
                minuti = null,
                km = 5.0,
                peso = 2.5,
                note = "Auto-generato per obiettivo: $obiettivi"
            )
        }
    }
}
