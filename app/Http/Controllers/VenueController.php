<?php

namespace App\Http\Controllers;

use App\Models\Venue;
use App\Models\Seat;
use Illuminate\Http\Request;
use App\Http\Requests\StoreVenueRequest;
use App\Http\Requests\UpdateVenueRequest;

class VenueController extends Controller
{
    public function index()
    {
        return Venue::select('id', 'name')->get()->map(function($venue) {
            return [
                'id' => $venue->id,
                'name' => $venue->name,
                // 'file' is no longer needed but kept for compatibility if frontend expects it, 
                // though we should refactor frontend to not need it.
            ];
        });
    }

    public function show($id)
    {
        $venue = Venue::with('seats')->findOrFail($id);
        
        // Transform to match the JSON structure expected by frontend
        return response()->json([
            'id' => $venue->id,
            'name' => $venue->name,
            'type' => $venue->type,
            'width' => $venue->width,
            'height' => $venue->height,
            'curvature' => $venue->curvature,
            'objects' => $venue->objects,
            'seatTypes' => $venue->seat_types, // Note camelCase
            'defaultSeatStyle' => $venue->default_seat_style,
            'seats' => $venue->seats->map(function($seat) {
                return [
                    'id' => $seat->json_id,
                    'x' => $seat->x,
                    'y' => $seat->y,
                    'status' => $seat->status,
                    'row' => $seat->row,
                    'place' => $seat->place,
                    'typeId' => $seat->type_id,
                    'rotation' => $seat->rotation,
                ];
            })
        ]);
    }

    public function store(StoreVenueRequest $request)
    {
        $validated = $request->validated();

        $venue = new Venue();
        $venue->id = 'venue-' . time(); // Simple ID generation
        $venue->name = $validated['name'];
        $venue->width = $validated['width'];
        $venue->height = $validated['height'];
        $venue->type = 'theater'; // Default
        $venue->curvature = 0;
        
        // Default objects/seat types
        $venue->objects = [];
        $venue->seat_types = [
             ['id' => 'standard', 'name' => 'Standard Seat', 'priceInCents' => 5000, 'style' => ['color' => '#64748b']]
        ];
        $venue->default_seat_style = [
            'width' => 30,
            'height' => 30,
            'borderRadius' => '4px',
            'color' => '#64748b'
        ];

        $venue->save();

        return response()->json($venue);
    }

    public function update(UpdateVenueRequest $request, $id)
    {
        try {
            $venue = Venue::findOrFail($id);
            
            // Use transaction to ensure data integrity
            \Illuminate\Support\Facades\DB::transaction(function () use ($venue, $request) {
                // 1. Update Venue Metadata
                $venue->update($request->only(['name', 'width', 'height', 'curvature']));
                
                if ($request->has('objects')) {
                    $venue->objects = $request->input('objects');
                }
                if ($request->has('seatTypes')) {
                    $venue->seat_types = $request->input('seatTypes');
                }
                if ($request->has('defaultSeatStyle')) {
                    $venue->default_seat_style = $request->input('defaultSeatStyle');
                }
                $venue->save();

                // 2. Sync Seats
                if ($request->has('seats')) {
                    $seatsData = $request->input('seats');
                    
                    $incomingJsonIds = collect($seatsData)
                        ->filter(fn($seat) => isset($seat['id']))
                        ->pluck('id')
                        ->toArray();

                    // Delete only seats that were actually removed in the editor
                    if (!empty($incomingJsonIds)) {
                        $venue->seats()->whereNotIn('json_id', $incomingJsonIds)->delete();
                    } else {
                        $venue->seats()->delete();
                    }
                    
                    $seatsToUpsert = [];
                    foreach ($seatsData as $seatData) {
                        if (!isset($seatData['id'])) continue; 

                        $seatsToUpsert[] = [
                            'venue_id' => $venue->id,
                            'json_id' => $seatData['id'],
                            'x' => $seatData['x'] ?? 0,
                            'y' => $seatData['y'] ?? 0,
                            'rotation' => $seatData['rotation'] ?? 0,
                            'row' => $seatData['row'] ?? null,
                            'place' => $seatData['place'] ?? null,
                            'type_id' => $seatData['typeId'] ?? 'standard',
                            'status' => $seatData['status'] ?? 'free',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                    
                    // Bulk upsert for performance and data safety
                    if (count($seatsToUpsert) > 0) {
                        Seat::upsert(
                            $seatsToUpsert,
                            ['venue_id', 'json_id'], // Unique fields to match on
                            ['x', 'y', 'rotation', 'row', 'place', 'type_id', 'updated_at'] // Only update layout fields; DO NOT update 'status', 'reserved_until', or 'reservation_token' to protect active checkouts!
                        ); 
                    }
                }
            });

            return response()->json($venue->fresh('seats'));

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Venue Save Failed: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            
            return response()->json([
                'error' => 'Save Failed', 
                'message' => $e->getMessage(),
                'trace' => $e->getFile() . ':' . $e->getLine()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $venue = Venue::findOrFail($id);
        $venue->seats()->delete(); // Delete associated seats
        $venue->delete();
        return response()->json(['message' => 'Venue deleted']);
    }
}
