<?php

namespace App\Http\Controllers;

use App\Models\Venue;
use Illuminate\Http\Request;

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
}
