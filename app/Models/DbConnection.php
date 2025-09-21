<?php
// app/Models/DbConnection.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class DbConnection extends Model
{
    protected $fillable = [
        'user_id',
        'host',
        'port',
        'database',
        'username',
        'password',
    ];

    protected $hidden = ['password']; // don’t leak in API

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Encrypt password when saving
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Crypt::encryptString($value);
    }

    // Decrypt password when reading
    public function getPasswordAttribute($value)
    {
        return Crypt::decryptString($value);
    }
}

