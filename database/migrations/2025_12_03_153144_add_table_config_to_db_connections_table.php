<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    // database/migrations/xxxx_add_table_config_to_db_connections_table.php
public function up()
{
    Schema::table('db_connections', function (Blueprint $table) {
        $table->string('table_name')->after('database');
        $table->string('primary_key')->after('table_name');
        $table->json('fields')->after('primary_key');
        $table->json('editable_fields')->after('fields');
        $table->json('input_types')->nullable()->after('editable_fields');
    });
}

public function down()
{
    Schema::table('db_connections', function (Blueprint $table) {
        $table->dropColumn(['table_name', 'primary_key', 'fields', 'editable_fields', 'input_types']);
    });
}

};
