package com.nonnoworkout.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

enum class WalterMascotState {
    Idle, Walking, Flexing, Trophy
}

@Composable
fun WalterMascotCard(
    state: WalterMascotState,
    modifier: Modifier = Modifier
) {
    val mood = when (state) {
        WalterMascotState.Idle -> "🐏 Walt the Goat è pronto!"
        WalterMascotState.Walking -> "🚶‍♂️ Walt cammina con te!"
        WalterMascotState.Flexing -> "💪 Walt ti dà energia!"
        WalterMascotState.Trophy -> "🏆 Grande! Walt festeggia!"
    }
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(text = "Walter the Walker", style = MaterialTheme.typography.titleSmall)
            Text(text = mood, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
