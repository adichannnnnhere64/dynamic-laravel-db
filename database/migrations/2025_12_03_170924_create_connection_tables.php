<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('connection_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('db_connection_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // Display name
            $table->string('table_name'); // Actual table name in database
            $table->string('primary_key')->default('id');
            $table->json('fields'); // Array of field names
            $table->json('editable_fields')->nullable(); // Which fields can be edited
            $table->json('input_types')->nullable(); // Input types for each field
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['db_connection_id', 'table_name']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('connection_tables');
    }
};
