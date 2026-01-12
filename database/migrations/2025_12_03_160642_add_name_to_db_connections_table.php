<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // database/migrations/xxxx_add_name_to_db_connections.php
public function up()
{
    Schema::table('db_connections', function (Blueprint $table) {
        $table->string('name')->after('user_id'); // Friendly name like "Main Inventory"
    });
}

public function down()
{
    Schema::table('db_connections', function (Blueprint $table) {
        $table->dropColumn('name');
    });
}

};
