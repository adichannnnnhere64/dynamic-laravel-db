<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('value_observer_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('value_observer_id')->constrained()->cascadeOnDelete();
            $table->string('record_id'); // The primary key value of the watched record
            $table->decimal('current_value', 15, 4)->nullable();
            $table->string('current_string_value')->nullable();
            $table->boolean('condition_met')->default(false);
            $table->text('details')->nullable();
            $table->json('notification_sent_to')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('value_observer_logs');
    }
};
