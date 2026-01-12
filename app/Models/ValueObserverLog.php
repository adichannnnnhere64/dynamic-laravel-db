<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ValueObserverLog extends Model
{
    protected $table = 'value_observer_logs';

    protected $fillable = [
        'value_observer_id',
        'record_id',
        'current_value',
        'current_string_value',
        'condition_met',
        'details',
        'notification_sent_to',
        'sent_at',
    ];

    protected $casts = [
        'condition_met' => 'boolean',
        'current_value' => 'decimal:4',
        'notification_sent_to' => 'array',
        'sent_at' => 'datetime',
    ];

    public function getCurrentValueAttribute($value)
    {
        return round($value);
    }

    public function observer()
    {
        return $this->belongsTo(ValueObserver::class, 'value_observer_id');
    }
}
