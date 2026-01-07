<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->string('id')->primary(); // keeping string ID as per JSON
            $table->string('name');
            $table->string('type')->nullable();
            $table->integer('width');
            $table->integer('height');
            $table->integer('curvature')->default(0);
            $table->json('objects')->nullable(); // detailed objects (stages etc)
            $table->json('seat_types')->nullable(); // pricing and styles
            $table->json('default_seat_style')->nullable();
            $table->timestamps();
        });

        Schema::create('seats', function (Blueprint $table) {
            $table->string('id'); // "seat-1"
            $table->string('venue_id');
            $table->foreign('venue_id')->references('id')->on('venues')->onDelete('cascade');
            
            $table->integer('x');
            $table->integer('y');
            $table->integer('rotation')->default(0);
            $table->string('row')->nullable(); // sometimes row is string "A", "1"
            $table->string('place')->nullable();
            
            $table->string('type_id'); // e.g. "vip"
            $table->string('status')->default('free'); // free, booked
            
            $table->primary(['venue_id', 'id']); // Composite primary? Or just use auto-increment and keep original ID as a field.
            // Let's use auto-increment ID for DB efficiency, and store json_id.
        });
        
        Schema::dropIfExists('seats');
        Schema::create('seats', function (Blueprint $table) {
            $table->id('db_id');
            $table->string('venue_id');
            $table->string('json_id'); // "seat-1"
            
            $table->integer('x');
            $table->integer('y');
            $table->integer('rotation')->default(0);
            $table->string('row')->nullable();
            $table->string('place')->nullable();
            $table->string('type_id');
            $table->string('status')->default('free');
            
            $table->timestamps();
            
            $table->foreign('venue_id')->references('id')->on('venues')->onDelete('cascade');
            $table->unique(['venue_id', 'json_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seats');
        Schema::dropIfExists('venues');
    }
};
