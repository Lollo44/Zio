package com.nonnoworkout.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nome: String,
    val eta: Int,
    val peso: Double,
    val livello: String,
    val obiettivo: String
)

@Entity(tableName = "activities")
data class ActivityEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nome: String,
    val tipo: String,
    @ColumnInfo(name = "gruppo_muscolare") val gruppoMuscolare: String,
    @ColumnInfo(name = "default_custom") val defaultCustom: String,
    val note: String?
)

@Entity(
    tableName = "plans",
    foreignKeys = [ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["id"],
        childColumns = ["user_id"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index(value = ["user_id"])]
)
data class PlanEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    val nome: String,
    @ColumnInfo(name = "automatico_custom") val automaticoCustom: String,
    @ColumnInfo(name = "data_creazione") val dataCreazione: String,
    val attivo: Boolean
)

@Entity(
    tableName = "plan_items",
    foreignKeys = [
        ForeignKey(
            entity = PlanEntity::class,
            parentColumns = ["id"],
            childColumns = ["plan_id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = ActivityEntity::class,
            parentColumns = ["id"],
            childColumns = ["activity_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["plan_id"]), Index(value = ["activity_id"])]
)
data class PlanItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "plan_id") val planId: Long,
    @ColumnInfo(name = "activity_id") val activityId: Long,
    @ColumnInfo(name = "giorno_settimana") val giornoSettimana: String,
    val serie: Int?,
    val ripetizioni: Int?,
    val minuti: Int?,
    val km: Double?,
    val peso: Double?,
    val note: String?
)

@Entity(
    tableName = "workouts",
    foreignKeys = [
        ForeignKey(
            entity = UserEntity::class,
            parentColumns = ["id"],
            childColumns = ["user_id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = PlanEntity::class,
            parentColumns = ["id"],
            childColumns = ["plan_id"],
            onDelete = ForeignKey.SET_NULL
        )
    ],
    indices = [Index(value = ["user_id"]), Index(value = ["plan_id"])]
)
data class WorkoutEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    @ColumnInfo(name = "plan_id") val planId: Long?,
    val data: String,
    @ColumnInfo(name = "durata_totale_minuti") val durataTotaleMinuti: Int
)

@Entity(
    tableName = "workout_items",
    foreignKeys = [
        ForeignKey(
            entity = WorkoutEntity::class,
            parentColumns = ["id"],
            childColumns = ["workout_id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = ActivityEntity::class,
            parentColumns = ["id"],
            childColumns = ["activity_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["workout_id"]), Index(value = ["activity_id"])]
)
data class WorkoutItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "workout_id") val workoutId: Long,
    @ColumnInfo(name = "activity_id") val activityId: Long,
    @ColumnInfo(name = "serie_effettive") val serieEffettive: Int?,
    @ColumnInfo(name = "ripetizioni_effettive") val ripetizioniEffettive: Int?,
    @ColumnInfo(name = "peso_effettivo") val pesoEffettivo: Double?,
    @ColumnInfo(name = "minuti_effettivi") val minutiEffettivi: Int?,
    @ColumnInfo(name = "km_effettivi") val kmEffettivi: Double?
)

@Entity(
    tableName = "walk_sessions",
    foreignKeys = [ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["id"],
        childColumns = ["user_id"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index(value = ["user_id"])]
)
data class WalkSessionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    val data: String,
    @ColumnInfo(name = "distanza_m") val distanzaMetri: Double,
    @ColumnInfo(name = "tempo_secondi") val tempoSecondi: Long,
    val passi: Int,
    @ColumnInfo(name = "velocita_media_m_s") val velocitaMediaMs: Double,
    @ColumnInfo(name = "percorso_gps") val percorsoGps: List<GpsPoint>,
    @ColumnInfo(name = "temperatura_esterna") val temperaturaEsterna: Double?,
    val note: String?
)

data class GpsPoint(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double? = null,
    val timestamp: Long? = null
)
