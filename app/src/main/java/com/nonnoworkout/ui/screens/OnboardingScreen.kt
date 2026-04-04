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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun OnboardingScreen(onCreatePlan: () -> Unit) {
    var eta by remember { mutableStateOf("") }
    var peso by remember { mutableStateOf("") }
    var livello by remember { mutableStateOf("") }
    var obiettivi by remember { mutableStateOf("") }
    var giorni by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = "Benvenuto in Walter the Walker", style = MaterialTheme.typography.headlineSmall)

        Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(value = eta, onValueChange = { eta = it }, label = { Text("Età") })
                OutlinedTextField(value = peso, onValueChange = { peso = it }, label = { Text("Peso") })
                OutlinedTextField(value = livello, onValueChange = { livello = it }, label = { Text("Livello") })
                OutlinedTextField(value = obiettivi, onValueChange = { obiettivi = it }, label = { Text("Obiettivi") })
                OutlinedTextField(value = giorni, onValueChange = { giorni = it }, label = { Text("Giorni disponibili") })
            }
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Button(onClick = onCreatePlan) { Text("Crea piano automatico") }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "Potrai sempre modificare il piano in seguito.")
        }
    }
}
