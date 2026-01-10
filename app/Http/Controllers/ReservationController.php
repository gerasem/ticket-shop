<?php

namespace App\Http\Controllers;

use App\Models\Seat;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ReservationController extends Controller
{
    public function reserve(Request $request)
    {
        $request->validate([
            'seat_ids' => 'required|array',
            'venue_id' => 'required|string|exists:venues,id',
        ]);

        $seatIds = $request->input('seat_ids');
        $venueId = $request->input('venue_id');
        
        // 1. Find seats by venue_id + json_id
        $seats = Seat::where('venue_id', $venueId)
                     ->whereIn('json_id', $seatIds)
                     ->get();

        // Check if all requested seats were found
        if ($seats->count() !== count($seatIds)) {
             return response()->json([
                'message' => "Invalid seat identifiers or seats not found in this venue.",
                'missing_count' => count($seatIds) - $seats->count()
             ], 422);
        }

        // 2. Check availability
        foreach ($seats as $seat) {
            $isExpired = $seat->reserved_until && Carbon::parse($seat->reserved_until)->isPast();
            
            if ($seat->status !== 'free' && !$isExpired) {
                return response()->json([
                    'message' => "Seat {$seat->row}-{$seat->place} is not available."
                ], 409); // Conflict
            }
        }

        // 3. Reserve them
        $token = Str::random(32);
        $expiresAt = Carbon::now()->addMinutes(15);

        // Update using the found Eloquent models to ensure we target correctly (ignoring db_id differences)
        Seat::where('venue_id', $venueId)
            ->whereIn('json_id', $seatIds)
            ->update([
                'status' => 'reserved',
                'reserved_until' => $expiresAt,
                'reservation_token' => $token
            ]);

        return response()->json([
            'reservation_token' => $token,
            'expires_at' => $expiresAt->toIso8601String()
        ]);
    }
}
