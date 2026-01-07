<?php

namespace Database\Seeders;

use App\Models\Seat;
use App\Models\Venue;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class VenueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Read the index file
        $indexPath = public_path('venues/venues-index.json');
        if (!File::exists($indexPath)) {
            $this->command->error("Index file not found at $indexPath");
            return;
        }

        $indexData = json_decode(File::get($indexPath), true);
        
        foreach ($indexData['venues'] as $venueInfo) {
            $venueId = $venueInfo['id'];
            $fileName = $venueInfo['file'];
            $filePath = public_path('venues/' . $fileName);

            if (!File::exists($filePath)) {
                $this->command->warn("Venue file not found: $fileName");
                continue;
            }

            $venueData = json_decode(File::get($filePath), true);

            // Create or update Venue
            $venue = Venue::updateOrCreate(
                ['id' => $venueId],
                [
                    'name' => $venueData['name'],
                    'type' => $venueData['type'] ?? 'unknown',
                    'width' => $venueData['width'] ?? 1000,
                    'height' => $venueData['height'] ?? 800,
                    'curvature' => $venueData['curvature'] ?? 0,
                    'objects' => $venueData['objects'] ?? [],
                    'seat_types' => $venueData['seatTypes'] ?? [],
                    'default_seat_style' => $venueData['defaultSeatStyle'] ?? [],
                ]
            );

            // Import Seats
            if (isset($venueData['seats'])) {
                // Delete existing seats for this venue to cleaner import (optional)
                // Seat::where('venue_id', $venueId)->delete(); 
                // Better use updateOrCreate to keep existing IDs stable if possible
                
                foreach ($venueData['seats'] as $seatData) {
                    Seat::updateOrCreate(
                        [
                            'venue_id' => $venueId, 
                            'json_id' => $seatData['id']
                        ],
                        [
                            'x' => $seatData['x'],
                            'y' => $seatData['y'],
                            'rotation' => $seatData['rotation'] ?? 0,
                            'row' => $seatData['row'] ?? null,
                            'place' => $seatData['place'] ?? null,
                            'type_id' => $seatData['typeId'],
                            'status' => $seatData['status'] ?? 'free',
                        ]
                    );
                }
            }
            
            $this->command->info("Imported venue: " . $venueData['name']);
        }
    }
}
