<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\VenueController;
use App\Http\Controllers\EventController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

Route::get('/venues', [VenueController::class, 'index']);
Route::get('/venues/{id}', [VenueController::class, 'show']);
Route::post('/reservations', [App\Http\Controllers\ReservationController::class, 'reserve']);

// Events routes
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    
    // Venue CRUD
    Route::post('/venues', [VenueController::class, 'store']);
    Route::put('/venues/{id}', [VenueController::class, 'update']);
    Route::delete('/venues/{id}', [VenueController::class, 'destroy']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbStatus = 'connected';
    } catch (\Exception $e) {
        $dbStatus = 'disconnected: ' . $e->getMessage();
    }

    return response()->json([
        'status' => 'ok',
        'message' => 'Backend is working',
        'database' => $dbStatus,
    ]);
});
