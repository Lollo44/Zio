package com.nonnoworkout.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun StatsScreen() {
    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(text = "Statistiche", style = MaterialTheme.typography.headlineSmall)

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Distanza camminata nel tempo")
                Text("Tempo totale di camminata")
                Text("Numero allenamenti a settimana")
                Text("Volume allenamento (serie x ripetizioni x peso)")
                Text("Miglioramenti (es. best 5km, volume)")
            }
        }
    }
}
