package com.superman.workfit.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.PlaylistAddCheck
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.superman.workfit.ui.screens.ActivitiesScreen
import com.superman.workfit.ui.screens.HomeScreen
import com.superman.workfit.ui.screens.PlansScreen
import com.superman.workfit.ui.screens.StatsScreen
import com.superman.workfit.ui.screens.WalkScreen
import com.superman.workfit.ui.screens.WorkoutScreen

private sealed class TopLevelDestination(
    val route: String,
    val label: String,
    val icon: @Composable () -> Unit
) {
    data object Home : TopLevelDestination("home", "Home", { Icon(Icons.Default.Dashboard, null) })
    data object Walk : TopLevelDestination("walk", "Camminata", { Icon(Icons.Default.DirectionsWalk, null) })
    data object Circuit : TopLevelDestination("circuit", "Circuito", { Icon(Icons.Default.FitnessCenter, null) })
    data object Plans : TopLevelDestination("plans", "Piani", { Icon(Icons.Default.PlaylistAddCheck, null) })
    data object Stats : TopLevelDestination("stats", "Statistiche", { Icon(Icons.Default.ShowChart, null) })
}

@Composable
fun SupermanWorkfitApp() {
    val navController = rememberNavController()
    val items = listOf(
        TopLevelDestination.Home,
        TopLevelDestination.Walk,
        TopLevelDestination.Circuit,
        TopLevelDestination.Plans,
        TopLevelDestination.Stats
    )

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route
                items.forEach { destination ->
                    NavigationBarItem(
                        selected = currentRoute == destination.route,
                        onClick = {
                            navController.navigate(destination.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = destination.icon,
                        label = { Text(destination.label) }
                    )
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = TopLevelDestination.Home.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(TopLevelDestination.Home.route) { HomeScreen() }
            composable(TopLevelDestination.Walk.route) { WalkScreen() }
            composable(TopLevelDestination.Circuit.route) { WorkoutScreen() }
            composable(TopLevelDestination.Plans.route) { PlansScreen() }
            composable(TopLevelDestination.Stats.route) { StatsScreen() }
            composable("activities") { ActivitiesScreen() }
        }
    }
}
