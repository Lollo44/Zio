package com.superman.workfit.data

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [
        UserEntity::class,
        ActivityEntity::class,
        WorkoutEntity::class,
        WorkoutItemEntity::class,
        WalkSessionEntity::class,
        PlanEntity::class,
        PlanItemEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun activityDao(): ActivityDao
    abstract fun workoutDao(): WorkoutDao
    abstract fun walkSessionDao(): WalkSessionDao
    abstract fun planDao(): PlanDao
}
