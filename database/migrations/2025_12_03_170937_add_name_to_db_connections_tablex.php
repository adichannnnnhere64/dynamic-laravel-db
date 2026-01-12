<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('db_connections', function (Blueprint $table) {
            // Remove old table-specific columns
            $table->dropColumn(['table_name', 'primary_key', 'fields', 'editable_fields', 'input_types']);
        });
    }

    public function down()
    {
        Schema::table('db_connections', function (Blueprint $table) {
            $table->string('table_name')->nullable();
            $table->string('primary_key')->nullable();
            $table->json('fields')->nullable();
            $table->json('editable_fields')->nullable();
            $table->json('input_types')->nullable();
        });
    }
};
