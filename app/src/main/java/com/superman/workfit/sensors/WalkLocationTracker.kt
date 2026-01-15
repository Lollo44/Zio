package com.superman.workfit.sensors

import android.annotation.SuppressLint
import android.content.Context
import android.os.Looper
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.superman.workfit.data.GpsPoint

class WalkLocationTracker(context: Context) {
    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
    private val locationRequest = LocationRequest.Builder(2000L)
        .setMinUpdateIntervalMillis(1000L)
        .build()

    private var locationCallback: LocationCallback? = null

    @SuppressLint("MissingPermission")
    fun start(onPoint: (GpsPoint) -> Unit) {
        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.locations.forEach { location ->
                    onPoint(
                        GpsPoint(
                            latitude = location.latitude,
                            longitude = location.longitude,
                            altitude = location.altitude,
                            timestamp = location.time
                        )
                    )
                }
            }
        }
        locationCallback = callback
        fusedLocationClient.requestLocationUpdates(locationRequest, callback, Looper.getMainLooper())
    }

    fun stop() {
        locationCallback?.let { fusedLocationClient.removeLocationUpdates(it) }
        locationCallback = null
    }
}
