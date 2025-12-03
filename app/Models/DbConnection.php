<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class DbConnection extends Model
{
    protected $table = 'db_connections';

    protected $fillable = [
        'user_id',
        'name',
        'host',
        'port',
        'database',
        'username',
        'password',
    ];

    protected $hidden = ['password'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tables()
    {
        return $this->hasMany(ConnectionTable::class)->orderBy('order')->orderBy('name');
    }

    public function activeTables()
    {
        return $this->tables()->where('is_active', true);
    }

    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getPasswordAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function getConnectionConfigAttribute()
    {
        return [
            'host' => $this->host,
            'port' => $this->port,
            'database' => $this->database,
            'username' => $this->username,
            'password' => $this->password,
        ];
    }
}
