package com.superman.workfit.data

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
    val livello: String
)

@Entity(tableName = "activities")
data class ActivityEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nome: String,
    val tipo: String,
    @ColumnInfo(name = "gruppo_muscolare") val gruppoMuscolare: String,
    @ColumnInfo(name = "default_custom") val defaultCustom: String
)

@Entity(
    tableName = "workouts",
    foreignKeys = [ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["id"],
        childColumns = ["user_id"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index(value = ["user_id"])]
)
data class WorkoutEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    val data: String,
    @ColumnInfo(name = "durata_totale") val durataTotale: Int
)

@Entity(
    tableName = "workout_items",
    primaryKeys = ["workout_id", "activity_id"],
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
    indices = [Index(value = ["activity_id"])]
)
data class WorkoutItemEntity(
    @ColumnInfo(name = "workout_id") val workoutId: Long,
    @ColumnInfo(name = "activity_id") val activityId: Long,
    val serie: Int,
    val ripetizioni: Int,
    val peso: Double?,
    val minuti: Int?,
    val km: Double?
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
    val distanza: Double,
    val tempo: Long,
    val passi: Int,
    val temperatura: Double?,
    @ColumnInfo(name = "percorso_gps") val percorsoGps: List<GpsPoint>
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
    @ColumnInfo(name = "automatico_custom") val automaticoCustom: String
)

@Entity(
    tableName = "plan_items",
    primaryKeys = ["plan_id", "activity_id"],
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
    indices = [Index(value = ["activity_id"])]
)
data class PlanItemEntity(
    @ColumnInfo(name = "plan_id") val planId: Long,
    @ColumnInfo(name = "activity_id") val activityId: Long,
    val serie: Int?,
    val ripetizioni: Int?,
    val minuti: Int?,
    val km: Double?
)

data class GpsPoint(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double? = null,
    val timestamp: Long? = null
)
