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

    public function show($id)
    {
        $event = Event::with('venue')->findOrFail($id);
        return response()->json($event);
    }
}
