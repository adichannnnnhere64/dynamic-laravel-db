<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('value_observers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connection_table_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('field_to_watch'); // Which column to monitor
            $table->string('condition_type'); // 'less_than', 'greater_than', 'equals', 'changes'
            $table->decimal('threshold_value', 15, 4)->nullable(); // For numeric conditions
            $table->string('string_value')->nullable(); // For string conditions
            $table->boolean('is_active')->default(true);
            $table->json('notification_emails'); // Array of emails to notify
            $table->string('notification_subject');
            $table->text('notification_message');
            $table->integer('check_interval_minutes')->default(60); // How often to check
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('last_triggered_at')->nullable();
            $table->integer('trigger_count')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'last_checked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('value_observers');
    }
};
