<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class DbConnection extends Model
{
    protected $table = 'db_connections';

    protected $fillable = [
        'user_id',
        'name',                    // e.g. "Main Products", "Inventory Backup"
        'host',
        'port',
        'database',
        'username',
        'password',
        'table_name',
        'primary_key',
        'fields',         // json array
        'editable_fields', // json array
        'input_types',     // json object
    ];

    protected $casts = [
        'fields' => 'array',
        'editable_fields' => 'array',
        'input_types' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getPasswordAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function getConfigAttribute()
    {
        return [
            'host' => $this->host,
            'port' => $this->port,
            'database' => $this->database,
            'username' => $this->username,
            'password' => $this->password,
            'table' => $this->table_name,
            'primary_key' => $this->primary_key,
            'fields' => $this->fields,
            'editable' => $this->editable_fields,
            'inputs' => $this->input_types ?? [],
        ];
    }
}
