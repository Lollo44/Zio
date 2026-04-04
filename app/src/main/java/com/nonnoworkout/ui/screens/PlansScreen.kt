package com.nonnoworkout.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class PlanItem(val day: String, val activity: String)

@Composable
fun PlansScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    var planItems by remember { mutableStateOf(emptyList<PlanItem>()) }
    var activePlan by remember { mutableStateOf(false) }
    var customDay by remember { mutableStateOf("") }
    var customActivity by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(text = "Piani", style = MaterialTheme.typography.headlineSmall)

        TabRow(selectedTabIndex = selectedTab) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("AUTOMATICO") })
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("CUSTOM") })
        }

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp), modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (selectedTab == 0) {
                    Text("Piani automatici generati da AI")
                    Button(onClick = {
                        planItems = listOf(
                            PlanItem("Lunedì", "Camminata 3 km + Stretching"),
                            PlanItem("Martedì", "Circuito pesi: Bicipiti, Tricipiti, Spalle"),
                            PlanItem("Mercoledì", "Riposo attivo - Passeggiata leggera 2 km"),
                            PlanItem("Giovedì", "Circuito pesi: Petto, Schiena, Addome"),
                            PlanItem("Venerdì", "Camminata 4 km"),
                            PlanItem("Sabato", "Circuito pesi: Gambe + Cardio"),
                            PlanItem("Domenica", "Riposo")
                        )
                        activePlan = false
                    }) { Text("Genera piano") }
                } else {
                    Text("Piani custom creati o modificati")
                    OutlinedTextField(
                        value = customDay,
                        onValueChange = { customDay = it },
                        label = { Text("Giorno") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = customActivity,
                        onValueChange = { customActivity = it },
                        label = { Text("Attività") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(onClick = {
                        if (customDay.isNotBlank() && customActivity.isNotBlank()) {
                            planItems = planItems + PlanItem(customDay, customActivity)
                            customDay = ""
                            customActivity = ""
                        }
                    }) { Text("Crea piano") }
                }
            }
        }

        if (planItems.isNotEmpty()) {
            Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = if (activePlan) "Piano attivo ✓" else "Piano della settimana",
                        style = MaterialTheme.typography.titleMedium
                    )
                    planItems.forEach { item ->
                        Column(modifier = Modifier.padding(vertical = 4.dp)) {
                            Text(text = item.day, fontWeight = FontWeight.Bold)
                            Text(text = item.activity)
                        }
                    }
                    if (!activePlan) {
                        Button(onClick = { activePlan = true }) { Text("Attiva piano") }
                    }
                }
            }
        }
    }
}
