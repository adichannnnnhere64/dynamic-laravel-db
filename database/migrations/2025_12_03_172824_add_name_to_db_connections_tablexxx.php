<?php

use App\Models\ConnectionTable;
use App\Models\DbConnection;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */

    public function up()
{
    DbConnection::all()->each(function ($conn) {
        if ($conn->table_name) {
            ConnectionTable::create([
                'db_connection_id' => $conn->id,
                'name' => $conn->name . ' Table',
                'table_name' => $conn->table_name,
                'primary_key' => $conn->primary_key,
                'fields' => $conn->fields,
                'editable_fields' => $conn->editable_fields,
                'input_types' => $conn->input_types,
            ]);
        }
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('db_connections_tablexxx', function (Blueprint $table) {
            //
        });
    }
};
