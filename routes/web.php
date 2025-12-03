<?php

use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user()->load('dbConnections.tables');

        if ($user->dbConnections->isNotEmpty()) {
            return redirect()->route('product.index');
        }

        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth'])->group(function () {
    // Connection management
    Route::get('/connect', [ProductController::class, 'showConnectForm'])->name('connect.form');
    Route::post('/connect', [ProductController::class, 'connect'])->name('connect');

    // Table management for a connection
    Route::get('/connect/{connection}/tables', [ProductController::class, 'showTables'])->name('connection.tables');
    Route::post('/connect/{connection}/tables', [ProductController::class, 'saveTable']);
    Route::delete('/connect/{connection}/tables/{table}', [ProductController::class, 'deleteTable']);

    // Product management
    Route::get('/product', [ProductController::class, 'index'])->name('product.index');
    Route::get('/product/create', [ProductController::class, 'create'])->name('product.create');
    Route::post('/product/store', [ProductController::class, 'store'])->name('product.store');
    Route::post('/product/search', [ProductController::class, 'findProduct'])->name('product.search');
    Route::get('/product/search', [ProductController::class, 'findProduct'])->name('product.search');
    Route::post('/product/update', [ProductController::class, 'updateProduct'])->name('product.update');
    Route::delete('/product/delete', [ProductController::class, 'deleteProduct'])->name('product.delete');

    // Connection deletion
    Route::delete('/connect/{id}', [ProductController::class, 'disconnect']);


    Route::prefix('api')->group(function () {
    Route::get('/connection/{connection}/tables/{table}/columns', [ProductController::class, 'getTableColumns']);
    Route::get('/connection/{connection}/tables/{table}/test', [ProductController::class, 'testTable']);
    Route::get('/connection/{connection}/tables/{table}/preview', [ProductController::class, 'tablePreview']);
    Route::get('/connection/{connection}/tables', [ProductController::class, 'getAllTables']);
});

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
