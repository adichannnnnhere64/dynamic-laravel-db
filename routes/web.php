<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\ValueObserverController;
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
    Route::put('/connect/{connection}/tables', [ProductController::class, 'saveTable']);
    Route::delete('/connect/{connection}/tables/{table}', [ProductController::class, 'deleteTable']);

    // Product management
    Route::get('/product', [ProductController::class, 'index'])->name('product.index');
    Route::get('/product/create', [ProductController::class, 'create'])->name('product.create');
    Route::put('/connect/{connection}', [App\Http\Controllers\ProductController::class, 'updateConnection'])->name('connection.update');
    Route::post('/product/store', [ProductController::class, 'store'])->name('product.store');
    Route::post('/product/search', [ProductController::class, 'findProduct'])->name('product.search');
    Route::get('/product/search', [ProductController::class, 'findProduct'])->name('product.search');
    Route::post('/product/update', [ProductController::class, 'updateProduct'])->name('product.update');
    Route::delete('/product/delete', [ProductController::class, 'deleteProduct'])->name('product.delete');


      Route::prefix('value-observers')->name('value-observers.')->group(function () {
        // List all observers
        Route::get('/', [ValueObserverController::class, 'index'])->name('index');

        // Create observer
        Route::get('/create', [ValueObserverController::class, 'create'])->name('create');
        Route::post('/', [ValueObserverController::class, 'store'])->name('store');

        // View observer details
        Route::get('/{observer}', [ValueObserverController::class, 'show'])->name('show');

        // Edit observer
        Route::get('/{observer}/edit', [ValueObserverController::class, 'edit'])->name('edit');
        Route::put('/{observer}', [ValueObserverController::class, 'update'])->name('update');

        Route::middleware(['auth', 'verified'])->group(function () {
    // ... other routes

    Route::post('value-observers/{observer}/test-notification', [ValueObserverController::class, 'testNotification'])
        ->name('value-observers.test-notification');
});

        // Delete observer
        Route::delete('/{observer}', [ValueObserverController::class, 'destroy'])->name('destroy');

        // Test observer (immediate check)
        Route::post('/{observer}/test', [ValueObserverController::class, 'test'])->name('test');

        // API endpoints
        Route::get('/api/tables/{tableId}/fields', [ValueObserverController::class, 'getTableFields']);

        // Observer logs (optional - for viewing logs separately)
        /* Route::get('/{observer}/logs', function (App\Models\ValueObserver $observer) { */
        /*     $logs = $observer->logs()->orderBy('created_at', 'desc')->paginate(50); */
        /*     return Inertia::render('ValueObservers/Logs', [ */
        /*         'observer' => $observer, */
        /*         'logs' => $logs, */
        /*     ]); */
        /* })->name('logs'); */

        Route::get('/{observer}/logs', [ValueObserverController::class, 'logs'])->name('logs');

    });


    Route::delete('/product/bulk-delete', [ProductController::class, 'bulkDelete'])->name('product.bulkDelete');

    // Connection deletion
    Route::delete('/connect/{id}', [ProductController::class, 'disconnect']);


    Route::prefix('api')->group(function () {
    Route::get('/connection/{connection}/tables/{table}/columns', [ProductController::class, 'getTableColumns']);
    Route::get('/connection/{connection}/tables/{table}/test', [ProductController::class, 'testTable']);
    Route::get('/connection/{connection}/tables/{table}/preview', [ProductController::class, 'tablePreview']);
    Route::get('/connection/{connection}/tables', [ProductController::class, 'getAllTables']);
    Route::put('/connect/{connection}', [App\Http\Controllers\ProductController::class, 'updateConnection'])->name('connection.update');

        Route::post('/connection/{connection}/test', [App\Http\Controllers\ProductController::class, 'testConnection'])->name('connection.test');
Route::get('/connection/{connection}/test', [App\Http\Controllers\ProductController::class, 'quickTest'])->name('connection.test.get');
});

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
