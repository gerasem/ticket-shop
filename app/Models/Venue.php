<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venue extends Model
{
    public $incrementing = false; // String ID
    protected $keyType = 'string';
    
    protected $fillable = [
        'id', 'name', 'type', 'width', 'height', 'curvature',
        'objects', 'seat_types', 'default_seat_style', 'background_image'
    ];

    protected $casts = [
        'objects' => 'array',
        'seat_types' => 'array',
        'default_seat_style' => 'array',
        'background_image' => 'array',
    ];

    public function seats()
    {
        return $this->hasMany(Seat::class, 'venue_id', 'id');
    }
}
