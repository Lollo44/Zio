package com.nonnoworkout.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity): Long

    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getUser(userId: Long): UserEntity?
}

@Dao
interface ActivityDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivities(activities: List<ActivityEntity>)

    @Query("SELECT * FROM activities ORDER BY nome")
    suspend fun getActivities(): List<ActivityEntity>
}

@Dao
interface PlanDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlan(plan: PlanEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlanItems(items: List<PlanItemEntity>)

    @Query("SELECT * FROM plans WHERE user_id = :userId")
    suspend fun getPlans(userId: Long): List<PlanEntity>

    @Query("SELECT * FROM plan_items WHERE plan_id = :planId")
    suspend fun getPlanItems(planId: Long): List<PlanItemEntity>
}

@Dao
interface WorkoutDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorkout(workout: WorkoutEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorkoutItems(items: List<WorkoutItemEntity>)

    @Query("SELECT * FROM workouts WHERE user_id = :userId ORDER BY data DESC")
    suspend fun getWorkouts(userId: Long): List<WorkoutEntity>
}

@Dao
interface WalkSessionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: WalkSessionEntity): Long

    @Query("SELECT * FROM walk_sessions WHERE user_id = :userId ORDER BY data DESC")
    suspend fun getSessions(userId: Long): List<WalkSessionEntity>
}
