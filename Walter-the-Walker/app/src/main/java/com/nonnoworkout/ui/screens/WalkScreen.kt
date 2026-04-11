package com.nonnoworkout.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

@Composable
fun WalkScreen() {
    var isWalking by remember { mutableStateOf(false) }
    var isPaused by remember { mutableStateOf(false) }
    var elapsedSeconds by remember { mutableLongStateOf(0L) }
    var distanceKm by remember { mutableDoubleStateOf(0.0) }
    var steps by remember { mutableIntStateOf(0) }
    var speedKmH by remember { mutableDoubleStateOf(0.0) }

    LaunchedEffect(isWalking, isPaused) {
        while (isWalking && !isPaused) {
            delay(1000L)
            elapsedSeconds++
            steps += 2
            distanceKm = steps * 0.0007
            val hours = elapsedSeconds / 3600.0
            speedKmH = if (hours > 0) distanceKm / hours else 0.0
        }
    }

    val timeFormatted = String.format(
        "%02d:%02d:%02d",
        elapsedSeconds / 3600,
        (elapsedSeconds % 3600) / 60,
        elapsedSeconds % 60
    )

    val statusText = when {
        !isWalking -> "pre-camminata"
        isPaused -> "in pausa"
        else -> "in corso"
    }

    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(text = "Camminata", style = MaterialTheme.typography.headlineSmall)

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Stato: $statusText")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { isWalking = true; isPaused = false },
                        enabled = !isWalking || isPaused
                    ) { Text("Avvia") }
                    Button(
                        onClick = { isPaused = !isPaused },
                        enabled = isWalking
                    ) { Text(if (isPaused) "Riprendi" else "Pausa") }
                    Button(onClick = {
                        isWalking = false
                        isPaused = false
                        elapsedSeconds = 0L
                        distanceKm = 0.0
                        steps = 0
                        speedKmH = 0.0
                    }) { Text("Termina") }
                }
                Button(onClick = {
                    isWalking = false
                    isPaused = false
                }) { Text("Salva") }
            }
        }

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Distanza: ${"%.2f".format(distanceKm)} km")
                Text("Tempo: $timeFormatted")
                Text("Velocità media: ${"%.1f".format(speedKmH)} km/h")
                Text("Passi: $steps")
                Text("Temperatura esterna: -- °C")
            }
        }

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Riepilogo post-camminata")
                Spacer(modifier = Modifier.height(4.dp))
                Text("Statistiche giornaliere, settimanali, mensili")
                Text("Grafici miglioramento")
            }
        }
    }
}
