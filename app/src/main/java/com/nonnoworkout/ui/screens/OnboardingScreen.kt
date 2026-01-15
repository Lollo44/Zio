package com.nonnoworkout.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun OnboardingScreen(onCreatePlan: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = "Benvenuto in Nonno Workout", style = MaterialTheme.typography.headlineSmall)

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(value = "", onValueChange = {}, label = { Text("Età") })
                OutlinedTextField(value = "", onValueChange = {}, label = { Text("Peso") })
                OutlinedTextField(value = "", onValueChange = {}, label = { Text("Livello") })
                OutlinedTextField(value = "", onValueChange = {}, label = { Text("Obiettivi") })
                OutlinedTextField(value = "", onValueChange = {}, label = { Text("Giorni disponibili") })
            }
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Button(onClick = onCreatePlan) { Text("Crea piano automatico") }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "Potrai sempre modificare il piano in seguito.")
        }
    }
}
