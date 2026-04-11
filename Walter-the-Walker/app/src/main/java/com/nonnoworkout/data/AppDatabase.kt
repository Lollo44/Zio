package com.nonnoworkout.data

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [
        UserEntity::class,
        ActivityEntity::class,
        PlanEntity::class,
        PlanItemEntity::class,
        WorkoutEntity::class,
        WorkoutItemEntity::class,
        WalkSessionEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun activityDao(): ActivityDao
    abstract fun planDao(): PlanDao
    abstract fun workoutDao(): WorkoutDao
    abstract fun walkSessionDao(): WalkSessionDao
}
