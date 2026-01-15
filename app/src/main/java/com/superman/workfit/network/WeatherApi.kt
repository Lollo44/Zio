package com.superman.workfit.network

import retrofit2.http.GET
import retrofit2.http.Query

interface WeatherApi {
    @GET("/v1/forecast")
    suspend fun getWeather(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("current") current: String = "temperature_2m"
    ): WeatherResponse
}

data class WeatherResponse(
    val current: WeatherCurrent?
)

data class WeatherCurrent(
    val temperature_2m: Double?
)
