<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

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
            'image' => 'nullable|string'
        ]);

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
            'image' => 'nullable|string'
        ]);

        $event->update($validated);
        return response()->json($event->load('venue'));
    }

    public function destroy($id)
    {
        $event = Event::findOrFail($id);
        $event->delete();
        return response()->json(['message' => 'Event deleted']);
    }
}
