package com.nonnoworkout.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
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
import androidx.compose.ui.unit.dp

@Composable
fun PlansScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }

    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(text = "Piani", style = MaterialTheme.typography.headlineSmall)

        TabRow(selectedTabIndex = selectedTab) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("AUTOMATICO") })
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("CUSTOM") })
        }

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (selectedTab == 0) {
                    Text("Piani automatici generati da AI")
                    Button(onClick = {}) { Text("Genera piano") }
                } else {
                    Text("Piani custom creati o modificati")
                    Button(onClick = {}) { Text("Crea piano") }
                }
            }
        }

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Piano della settimana")
                Text("Piano del giorno")
                Button(onClick = {}) { Text("Attiva piano") }
            }
        }
    }
}
