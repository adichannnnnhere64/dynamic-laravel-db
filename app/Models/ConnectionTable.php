<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConnectionTable extends Model
{
    protected $table = 'connection_tables';

    protected $fillable = [
        'db_connection_id',
        'name',
        'table_name',
        'primary_key',
        'fields',
        'editable_fields',
        'input_types',
        'order',
        'is_active'
    ];

    protected $casts = [
        'fields' => 'array',
        'editable_fields' => 'array',
        'input_types' => 'array',
    ];

    public function connection()
    {
        return $this->belongsTo(DbConnection::class, 'db_connection_id');
    }

    public function getConfigAttribute()
    {
        return [
            'table_name' => $this->table_name,
            'primary_key' => $this->primary_key,
            'fields' => $this->fields,
            'editable_fields' => $this->editable_fields ?? [],
            'input_types' => $this->input_types ?? [],
        ];
    }
}
