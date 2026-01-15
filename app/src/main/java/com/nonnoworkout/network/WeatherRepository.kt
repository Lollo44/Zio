package com.nonnoworkout.network

import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

class WeatherRepository(
    private val apiKey: String
) {
    private val api: WeatherApi = Retrofit.Builder()
        .baseUrl("https://api.openweathermap.org/")
        .addConverterFactory(MoshiConverterFactory.create())
        .build()
        .create(WeatherApi::class.java)

    suspend fun loadTemperature(latitude: Double, longitude: Double): Double? {
        return api.getWeather(latitude, longitude, apiKey).main?.temp
    }
}
