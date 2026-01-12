<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TableController;

Route::middleware(['auth:sanctum'])->group(function () {
    // Get columns for a specific table
    Route::get('/connection/{connection}/tables/{table}/columns', [TableController::class, 'getColumns']);

    // Test table connection
    Route::get('/connection/{connection}/tables/{table}/test', [TableController::class, 'testConnection']);

    // Get table data preview
    Route::get('/connection/{connection}/tables/{table}/preview', [TableController::class, 'getPreview']);
});




