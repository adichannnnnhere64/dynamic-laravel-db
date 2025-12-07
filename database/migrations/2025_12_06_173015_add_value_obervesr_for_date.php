<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('value_observers', function (Blueprint $table) {
            // Add date monitoring fields
            $table->string('date_field_type')->nullable()->after('string_value')->comment('date, datetime, timestamp');
            $table->integer('days_before_alert')->nullable()->after('date_field_type');
            $table->integer('days_after_alert')->nullable()->after('days_before_alert');
            $table->boolean('alert_on_expired')->default(false)->after('days_after_alert');
            $table->string('date_format')->nullable()->after('alert_on_expired')->comment('Y-m-d, Y-m-d H:i:s, etc');
        });
    }

    public function down(): void
    {
        Schema::table('value_observers', function (Blueprint $table) {
            $table->dropColumn([
                'date_field_type',
                'days_before_alert',
                'days_after_alert',
                'alert_on_expired',
                'date_format',
            ]);
        });
    }
};
