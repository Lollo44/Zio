package com.nonnoworkout.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun StatsScreen() {
    var selectedPeriod by remember { mutableIntStateOf(0) }
    val periods = listOf("Settimana", "Mese", "Totale")

    data class StatsData(
        val totalWalks: Int,
        val totalDistanceKm: Double,
        val totalTimeMin: Int,
        val totalWorkouts: Int,
        val bestWalkKm: Double
    )

    val stats = remember {
        mapOf(
            0 to StatsData(totalWalks = 5, totalDistanceKm = 18.5, totalTimeMin = 240, totalWorkouts = 3, bestWalkKm = 5.2),
            1 to StatsData(totalWalks = 18, totalDistanceKm = 72.3, totalTimeMin = 960, totalWorkouts = 12, bestWalkKm = 6.1),
            2 to StatsData(totalWalks = 64, totalDistanceKm = 245.8, totalTimeMin = 3200, totalWorkouts = 42, bestWalkKm = 7.0)
        )
    }

    val current = stats[selectedPeriod] ?: stats[0]!!

    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(text = "Statistiche", style = MaterialTheme.typography.headlineSmall)

        TabRow(selectedTabIndex = selectedPeriod) {
            periods.forEachIndexed { index, title ->
                Tab(
                    selected = selectedPeriod == index,
                    onClick = { selectedPeriod = index },
                    text = { Text(title) }
                )
            }
        }

        Text(text = "Periodo: ${periods[selectedPeriod]}", style = MaterialTheme.typography.titleMedium)

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp), modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                StatRow("Camminate totali", "${current.totalWalks}")
                StatRow("Distanza totale", "${"%.1f".format(current.totalDistanceKm)} km")
                StatRow("Tempo totale", "${current.totalTimeMin / 60}h ${current.totalTimeMin % 60}min")
                StatRow("Allenamenti totali", "${current.totalWorkouts}")
                StatRow("Miglior camminata", "${"%.1f".format(current.bestWalkKm)} km")
            }
        }
    }
}

@Composable
private fun StatRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label)
        Text(text = value, fontWeight = FontWeight.Bold)
    }
}
