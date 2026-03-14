<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\VenueController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ReservationController;

// Events
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);

// Venues
Route::get('/venues', [VenueController::class, 'index']);
Route::get('/venues/{id}', [VenueController::class, 'show']);

// Reservations
Route::post('/reservations', [ReservationController::class, 'reserve']);
