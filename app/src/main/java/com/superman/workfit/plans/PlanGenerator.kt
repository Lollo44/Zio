package com.superman.workfit.plans

import com.superman.workfit.data.PlanItemEntity

class PlanGenerator {
    fun generatePlan(
        eta: Int,
        livello: String,
        obiettivi: String,
        giorniDisponibili: Int
    ): List<PlanItemEntity> {
        return List(giorniDisponibili) { index ->
            PlanItemEntity(
                planId = 0,
                activityId = index.toLong() + 1,
                serie = if (livello.lowercase() == "principiante") 3 else 4,
                ripetizioni = 10,
                minuti = null,
                km = null
            )
        }
    }
}
