<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('value_observer_logs', function (Blueprint $table) {
            $table->dateTime('current_date_value')->nullable()->after('current_string_value');
        });
    }

    public function down(): void
    {
        Schema::table('value_observer_logs', function (Blueprint $table) {
            $table->dropColumn('current_date_value');
        });
    }
};
