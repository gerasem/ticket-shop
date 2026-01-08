<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    public function index()
    {
        $events = Event::with('venue')->orderBy('date', 'asc')->get();
        return response()->json($events);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'date' => 'required|date',
            'time' => 'required',
            'venue_id' => 'required|exists:venues,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240'
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $this->handleImageUpload($request->file('image'));
        }

        $event = Event::create($validated);
        return response()->json($event->load('venue'), 201);
    }

    public function show($id)
    {
        $event = Event::with('venue')->findOrFail($id);
        return response()->json($event);
    }

    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required',
            'venue_id' => 'sometimes|required|exists:venues,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240'
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($event->image) {
                Storage::disk('public')->delete($event->image);
            }
            $validated['image'] = $this->handleImageUpload($request->file('image'));
        }

        $event->update($validated);
        return response()->json($event->load('venue'));
    }

    public function destroy($id)
    {
        $event = Event::findOrFail($id);
        
        // Delete image if exists
        if ($event->image) {
            Storage::disk('public')->delete($event->image);
        }
        
        $event->delete();
        return response()->json(['message' => 'Event deleted']);
    }

    /**
     * Handle image upload and resize to 16:9 aspect ratio
     */
    /**
     * Handle image upload without resizing (bypass GD issues)
     */
    private function handleImageUpload($file)
    {
        // Store the file directly in 'public/events' directory
        // Storage::putFile returns the path like 'events/hash.jpg'
        $path = Storage::disk('public')->putFile('events', $file);
        
        return $path;
    }
}
