package com.nonnoworkout.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ActivitiesScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }

    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(text = "Attività", style = MaterialTheme.typography.headlineSmall)

        TabRow(selectedTabIndex = selectedTab) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("DEFAULT") })
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("CUSTOM") })
        }

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (selectedTab == 0) {
                    Text("Esercizi default: bicipiti, tricipiti, petto, spalle, schiena, addome, gambe, cardio")
                } else {
                    Text("Esercizi custom: nome, tipo, gruppo muscolare, note")
                }
            }
        }
    }
}
