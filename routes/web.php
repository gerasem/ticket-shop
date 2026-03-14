<?php

use Illuminate\Support\Facades\Route;

Route::get('/ticket-shop/{any?}', function () {
    return view('ticket-shop');
})->where('any', '.*');

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
